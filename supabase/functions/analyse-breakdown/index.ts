import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function unauthorized() {
  return jsonResponse({ error: 'Unauthorized' }, 401);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return unauthorized();

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized();

  if (!LOVABLE_API_KEY) {
    return jsonResponse({ error: 'AI service not configured' }, 503);
  }

  try {
    const body = await req.json();
    const { description, problem_type, urgency, materials_involved, required_tools } = body;

    // Validate description
    if (!description || typeof description !== 'string') {
      return jsonResponse({ error: 'description is required' }, 422);
    }
    if (description.trim().length < 10) {
      return jsonResponse({ error: 'Description too short (minimum 10 characters)' }, 422);
    }
    if (description.trim().length > 5000) {
      return jsonResponse({ error: 'Description too long (maximum 5000 characters)' }, 422);
    }

    // Build prompt
    const contextParts: string[] = [`Problem description: ${description.trim()}`];
    if (problem_type) contextParts.push(`Problem type: ${problem_type}`);
    if (urgency) contextParts.push(`Urgency: ${urgency}`);
    if (materials_involved && Array.isArray(materials_involved) && materials_involved.length > 0) {
      contextParts.push(`Materials involved: ${materials_involved.join(', ')}`);
    }
    if (required_tools && Array.isArray(required_tools) && required_tools.length > 0) {
      contextParts.push(`Required tools: ${required_tools.join(', ')}`);
    }

    const systemPrompt = `You are a UK trades expert. Given a home repair/maintenance problem, produce an ordered task list from preparation through to sign-off. Each task must have:
- title: a short action description
- difficulty_level: one of "easy", "medium", or "hard"
- estimated_minutes: integer estimate

Return ONLY valid JSON matching this schema:
{"tasks":[{"title":"...","difficulty_level":"easy|medium|hard","estimated_minutes":N}]}

Order tasks logically: safety/isolation first, then diagnosis, repair steps, reassembly, testing, and cleanup last.`;

    const userPrompt = contextParts.join('\n');

    const response = await fetch(AI_GATEWAY, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_task_breakdown',
              description: 'Return the ordered task breakdown for a repair job.',
              parameters: {
                type: 'object',
                properties: {
                  tasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        difficulty_level: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                        estimated_minutes: { type: 'integer' },
                      },
                      required: ['title', 'difficulty_level', 'estimated_minutes'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['tasks'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_task_breakdown' } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return jsonResponse({ error: 'Rate limited — please try again shortly' }, 429);
      if (status === 402) return jsonResponse({ error: 'AI credits exhausted' }, 402);
      const errText = await response.text();
      console.error('AI gateway error:', status, errText);
      return jsonResponse({ error: 'AI service error' }, 502);
    }

    const aiData = await response.json();

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error('Malformed AI response — no tool call:', JSON.stringify(aiData));
      return jsonResponse({ error: 'AI returned malformed response' }, 502);
    }

    let parsed: { tasks: unknown[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error('Failed to parse tool call arguments:', toolCall.function.arguments);
      return jsonResponse({ error: 'AI returned malformed JSON' }, 502);
    }

    if (!parsed.tasks || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
      console.error('AI returned empty or invalid tasks:', JSON.stringify(parsed));
      return jsonResponse({ error: 'AI returned malformed response' }, 502);
    }

    return jsonResponse({ tasks: parsed.tasks }, 200);
  } catch (error) {
    console.error('Breakdown error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: msg }, 500);
  }
});
