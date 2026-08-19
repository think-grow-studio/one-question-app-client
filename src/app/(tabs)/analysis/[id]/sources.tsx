import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReportSourcesContent } from '@/features/analysis/components/ReportSourcesContent';
import { parseAnalysisReportId } from '@/features/analysis/model/analysisPresentation';

export default function AnalysisSourcesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ReportSourcesContent
      reportId={parseAnalysisReportId(id)}
      onBack={() => router.back()}
    />
  );
}
