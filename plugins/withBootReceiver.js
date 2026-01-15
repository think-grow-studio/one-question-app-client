const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
  withPlugins,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Boot Receiver를 추가하는 Config Plugin
 * 기기 재부팅 후 알림을 자동으로 재스케줄합니다.
 */

// AndroidManifest.xml에 권한과 Receiver 추가
function withBootReceiverManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // RECEIVE_BOOT_COMPLETED 권한 추가
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const hasBootPermission = manifest['uses-permission'].some(
      (perm) => perm.$?.['android:name'] === 'android.permission.RECEIVE_BOOT_COMPLETED'
    );

    if (!hasBootPermission) {
      manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.RECEIVE_BOOT_COMPLETED' },
      });
    }

    // BroadcastReceiver 추가
    const application = manifest.application?.[0];
    if (application) {
      if (!application.receiver) {
        application.receiver = [];
      }

      const hasBootReceiver = application.receiver.some(
        (receiver) => receiver.$?.['android:name'] === '.notification.BootReceiver'
      );

      if (!hasBootReceiver) {
        application.receiver.push({
          $: {
            'android:name': '.notification.BootReceiver',
            'android:enabled': 'true',
            'android:exported': 'true',
          },
          'intent-filter': [
            {
              action: [
                { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
              ],
              category: [
                { $: { 'android:name': 'android.intent.category.DEFAULT' } },
              ],
            },
          ],
        });
      }

      // NotificationPublisher Receiver 추가
      const hasNotificationPublisher = application.receiver.some(
        (receiver) => receiver.$?.['android:name'] === '.notification.NotificationPublisher'
      );

      if (!hasNotificationPublisher) {
        application.receiver.push({
          $: {
            'android:name': '.notification.NotificationPublisher',
            'android:enabled': 'true',
            'android:exported': 'false',
          },
        });
      }
    }

    return config;
  });
}

// 네이티브 Kotlin 파일 생성
function withBootReceiverFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;

      // 패키지명 가져오기
      const packageName = config.android?.package || 'com.onequestion.app';
      const packagePath = packageName.replace(/\./g, '/');

      const notificationDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        packagePath,
        'notification'
      );

      // 디렉토리 생성
      if (!fs.existsSync(notificationDir)) {
        fs.mkdirSync(notificationDir, { recursive: true });
      }

      // BootReceiver.kt 생성
      const bootReceiverContent = `package ${packageName}.notification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * 기기 재부팅 시 알림을 재스케줄하는 BroadcastReceiver
 */
class BootReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "Boot completed - rescheduling notifications")
            NotificationScheduler.rescheduleFromPreferences(context)
        }
    }
}
`;

      // NotificationScheduler.kt 생성
      const notificationSchedulerContent = `package ${packageName}.notification

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import java.util.Calendar

/**
 * 알림 스케줄링을 담당하는 헬퍼 클래스
 */
object NotificationScheduler {
    private const val TAG = "NotificationScheduler"
    private const val PREFS_NAME = "notification-storage"
    private const val CHANNEL_ID = "daily-reminder"
    private const val NOTIFICATION_REQUEST_CODE = 1001

    /**
     * SharedPreferences에서 설정을 읽어 알림을 재스케줄
     */
    fun rescheduleFromPreferences(context: Context) {
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val jsonString = prefs.getString("state", null)

            if (jsonString == null) {
                Log.d(TAG, "No notification settings found")
                return
            }

            // JSON 파싱 (간단한 방식)
            val isEnabled = jsonString.contains("\\"isEnabled\\":true")
            if (!isEnabled) {
                Log.d(TAG, "Notifications are disabled")
                return
            }

            // hour, minute, title, body 추출
            val hourRegex = "\\"hour\\":(\\\\d+)".toRegex()
            val minuteRegex = "\\"minute\\":(\\\\d+)".toRegex()
            val titleRegex = "\\"title\\":\\"([^\\"]*)\\"".toRegex()
            val bodyRegex = "\\"body\\":\\"([^\\"]*)\\"".toRegex()

            val hourMatch = hourRegex.find(jsonString)
            val minuteMatch = minuteRegex.find(jsonString)
            val titleMatch = titleRegex.find(jsonString)
            val bodyMatch = bodyRegex.find(jsonString)

            val hour = hourMatch?.groupValues?.get(1)?.toIntOrNull() ?: 21
            val minute = minuteMatch?.groupValues?.get(1)?.toIntOrNull() ?: 0
            val title = titleMatch?.groupValues?.get(1) ?: "One Question"
            val body = bodyMatch?.groupValues?.get(1) ?: "오늘의 질문에 답을 해보세요."

            Log.d(TAG, "Rescheduling notification for \$hour:\$minute with title: \$title")

            // 알림 채널 생성 (Android 8.0+)
            createNotificationChannel(context)

            // 알림 스케줄
            scheduleNotification(context, hour, minute, title, body)

        } catch (e: Exception) {
            Log.e(TAG, "Failed to reschedule notification", e)
        }
    }

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Daily Reminder"
            val descriptionText = "Daily question reminder notifications"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 250, 250)
            }

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun scheduleNotification(context: Context, hour: Int, minute: Int, title: String, body: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        val intent = Intent(context, NotificationPublisher::class.java).apply {
            putExtra("title", title)
            putExtra("body", body)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            NOTIFICATION_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // 다음 알림 시간 계산
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)

            // 이미 지난 시간이면 다음 날로
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        // 매일 반복 알람 설정
        alarmManager.setRepeating(
            AlarmManager.RTC_WAKEUP,
            calendar.timeInMillis,
            AlarmManager.INTERVAL_DAY,
            pendingIntent
        )

        Log.d(TAG, "Notification scheduled for \${calendar.time}")
    }
}
`;

      // NotificationPublisher.kt 생성
      const notificationPublisherContent = `package ${packageName}.notification

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * 스케줄된 시간에 알림을 발송하는 BroadcastReceiver
 */
class NotificationPublisher : BroadcastReceiver() {
    companion object {
        private const val TAG = "NotificationPublisher"
        private const val CHANNEL_ID = "daily-reminder"
        private const val NOTIFICATION_ID = 1
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Publishing notification")

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Intent에서 title과 body 읽기 (다국어 지원)
        val title = intent.getStringExtra("title") ?: "One Question"
        val body = intent.getStringExtra("body") ?: "오늘의 질문에 답을 해보세요."

        // 앱 아이콘 가져오기
        val appInfo = context.applicationInfo

        // 알림 클릭 시 앱 열기
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentIntent = PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(appInfo.icon)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(contentIntent)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
    }
}
`;

      // NotificationPreferencesModule.kt 생성 (React Native에서 호출 가능)
      const preferencesModuleContent = `package ${packageName}.notification

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.util.Log

/**
 * React Native에서 SharedPreferences에 알림 설정을 저장/읽기 위한 네이티브 모듈
 */
class NotificationPreferencesModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val TAG = "NotificationPrefs"
        private const val PREFS_NAME = "notification-storage"
    }

    override fun getName(): String = "NotificationPreferences"

    @ReactMethod
    fun saveNotificationSettings(isEnabled: Boolean, hour: Int, minute: Int, title: String, body: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            // JSON에서 특수문자 이스케이프 처리
            val escapedTitle = title.replace("\\\\", "\\\\\\\\").replace("\"", "\\\\\"")
            val escapedBody = body.replace("\\\\", "\\\\\\\\").replace("\"", "\\\\\"")
            val jsonString = """{"state":{"isEnabled":$isEnabled,"hour":$hour,"minute":$minute,"title":"$escapedTitle","body":"$escapedBody"}}"""

            prefs.edit()
                .putString("state", jsonString)
                .apply()

            Log.d(TAG, "Saved notification settings: enabled=$isEnabled, time=$hour:$minute, title=$title")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save notification settings", e)
            promise.reject("SAVE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getNotificationSettings(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val jsonString = prefs.getString("state", null)
            promise.resolve(jsonString)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get notification settings", e)
            promise.reject("GET_ERROR", e.message)
        }
    }
}
`;

      // NotificationPackage.kt 생성 (모듈 등록용)
      const packageContent = `package ${packageName}.notification

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * NotificationPreferencesModule을 React Native에 등록하는 패키지
 */
class NotificationPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(NotificationPreferencesModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

      // 파일 쓰기
      fs.writeFileSync(
        path.join(notificationDir, 'BootReceiver.kt'),
        bootReceiverContent
      );
      fs.writeFileSync(
        path.join(notificationDir, 'NotificationScheduler.kt'),
        notificationSchedulerContent
      );
      fs.writeFileSync(
        path.join(notificationDir, 'NotificationPublisher.kt'),
        notificationPublisherContent
      );
      fs.writeFileSync(
        path.join(notificationDir, 'NotificationPreferencesModule.kt'),
        preferencesModuleContent
      );
      fs.writeFileSync(
        path.join(notificationDir, 'NotificationPackage.kt'),
        packageContent
      );

      console.log('Boot Receiver files created successfully');

      return config;
    },
  ]);
}

// MainApplication에 패키지 등록
function withNotificationPackage(config) {
  return withMainApplication(config, async (config) => {
    const mainApplication = config.modResults;
    const packageName = config.android?.package || 'com.onequestion.app';

    // import 추가
    const importStatement = `import ${packageName}.notification.NotificationPackage`;
    if (!mainApplication.contents.includes(importStatement)) {
      mainApplication.contents = mainApplication.contents.replace(
        /^(package .+\n)/m,
        `$1\n${importStatement}\n`
      );
    }

    // getPackages()에 NotificationPackage 추가
    if (!mainApplication.contents.includes('NotificationPackage()')) {
      // Kotlin 버전 (New Architecture)
      mainApplication.contents = mainApplication.contents.replace(
        /(override fun getPackages\(\): List<ReactPackage> \{[\s\S]*?packages\.apply \{)/,
        '$1\n            add(NotificationPackage())'
      );

      // 만약 위 패턴이 안 맞으면 Java 스타일 시도
      if (!mainApplication.contents.includes('NotificationPackage()')) {
        mainApplication.contents = mainApplication.contents.replace(
          /(packages\.add\()/,
          'packages.add(NotificationPackage())\n            $1'
        );
      }
    }

    return config;
  });
}

// 플러그인 내보내기
module.exports = function withBootReceiver(config) {
  return withPlugins(config, [
    withBootReceiverManifest,
    withBootReceiverFiles,
    withNotificationPackage,
  ]);
};
