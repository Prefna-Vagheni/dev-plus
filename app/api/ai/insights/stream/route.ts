// import { NextRequest } from 'next/server';
// import { getSession } from '@/lib/auth-utils';
// import { createAIService, InsightType } from '@/lib/ai/service';
// import { withRateLimit } from '@/lib/middleware/rate-limit';

// export async function POST(request: NextRequest) {
//   try {
//     const session = await getSession();
//     if (!session?.user) {
//       return new Response('Unauthorized', { status: 401 });
//     }

//     const rateLimitCheck = await withRateLimit(
//       request,
//       { max: 10, window: 300 },
//       session.user.id,
//     );
//     if (rateLimitCheck) return rateLimitCheck;

//     const body = await request.json();
//     const { type, query } = body as {
//       type: InsightType;
//       query?: string;
//     };

//     if (!type) {
//       return new Response('Insight type is required', { status: 400 });
//     }

//     const encoder = new TextEncoder();
//     const stream = new ReadableStream({
//       async start(controller) {
//         try {
//           const aiService = createAIService(session.user.id);

//           for await (const chunk of aiService.generateInsightStream(type, {
//             query,
//           })) {
//             const data = `data: ${JSON.stringify({ chunk })}\n\n`;
//             controller.enqueue(encoder.encode(data));
//           }

//           controller.enqueue(
//             encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
//           );
//           controller.close();
//         } catch (error) {
//           console.error('[API] Streaming error:', error);
//           const errorData = `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`;
//           controller.enqueue(encoder.encode(errorData));
//           controller.close();
//         }
//       },
//     });

//     return new Response(stream, {
//       headers: {
//         'Content-Type': 'text/event-stream',
//         'Cache-Control': 'no-cache',
//         Connection: 'keep-alive',
//       },
//     });
//   } catch (error) {
//     console.error('[API] Stream setup error:', error);
//     return new Response('Failed to start stream', { status: 500 });
//   }
// }

import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth-utils';
import { createAIService, InsightType } from '@/lib/ai/service';
import { withRateLimit } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const rateLimitCheck = await withRateLimit(
      request,
      { max: 10, window: 300 },
      session.user.id,
    );
    if (rateLimitCheck) return rateLimitCheck;

    const body = await request.json();
    const { type, query } = body as { type: InsightType; query?: string };

    if (!type) {
      return new Response('Insight type is required', { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const aiService = createAIService(session.user.id);

          // Iterate over the chunks from Gemini
          for await (const chunk of aiService.generateInsightStream(type, {
            query,
          })) {
            // chunk is usually { type: 'text', content: '...' }
            const data = `data: ${JSON.stringify({ chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Signal successful completion
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
          );
          controller.close();
        } catch (error: any) {
          console.error('[API] Streaming error:', error);

          // FIX: Pass the actual error message to the frontend
          const errorMessage = error.message || 'Unknown AI error';
          const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;

          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}
