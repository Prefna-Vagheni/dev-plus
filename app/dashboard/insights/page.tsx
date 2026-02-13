import { InsightGenerator } from '@/components/ai/insight-generator';

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">AI Insights</h2>
        <p className="text-gray-500">
          Get personalized insights powered by Google Gemini
        </p>
      </div>

      <InsightGenerator />
    </div>
  );
}
