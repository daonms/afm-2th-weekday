#!/usr/bin/env node
/**
 * Parallel Coordinator MCP Server
 *
 * Claude Code ↔ Cursor AI 병렬 작업 조율 서버
 * Node.js 빌트인만 사용 — npm install 불필요
 *
 * MCP Protocol over stdio:
 *   Claude Code → .claude/settings.local.json mcpServers
 *   Cursor AI  → .cursor/mcp.json mcpServers
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(__dirname, 'tasks.json');

// ─── 상태 관리 ────────────────────────────────────────────────
function loadState() {
  if (!existsSync(STATE_FILE)) return { tasks: [], nextId: 1 };
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf-8')); }
  catch { return { tasks: [], nextId: 1 }; }
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// ─── MCP 도구 정의 ─────────────────────────────────────────────
const TOOLS = [
  {
    name: 'create_task',
    description: '병렬 작업을 생성하고 Claude 또는 Cursor에 할당합니다. 복잡한 작업을 분리하여 두 AI가 동시에 작업할 때 사용.',
    inputSchema: {
      type: 'object',
      properties: {
        title:       { type: 'string', description: '작업 제목 (한국어 가능)' },
        description: { type: 'string', description: '상세 작업 내용 — 담당 AI가 이 설명대로 작업합니다' },
        assigned_to: { type: 'string', enum: ['claude', 'cursor'], description: '담당 AI: claude (Claude Code) 또는 cursor (Cursor AI)' },
        priority:    { type: 'string', enum: ['high', 'medium', 'low'], default: 'medium', description: '우선순위' },
        files:       { type: 'array', items: { type: 'string' }, description: '작업 대상 파일 목록 (상대경로)' },
        depends_on:  { type: 'array', items: { type: 'string' }, description: '선행 작업 ID 목록 (선행 완료 후 이 작업 시작)' }
      },
      required: ['title', 'description', 'assigned_to']
    }
  },
  {
    name: 'list_tasks',
    description: '현재 모든 작업 목록과 상태를 조회합니다. 병렬 작업 진행 상황 확인에 사용.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['all', 'pending', 'in_progress', 'completed', 'failed', 'claude', 'cursor'],
          default: 'all',
          description: '필터: 상태별 또는 담당 AI별로 필터링'
        }
      }
    }
  },
  {
    name: 'start_task',
    description: '작업 시작을 선언합니다. Cursor AI가 작업을 시작할 때 먼저 이 도구를 호출하세요.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: '시작할 작업 ID' },
        worker:  { type: 'string', enum: ['claude', 'cursor'], description: '작업을 시작하는 AI' }
      },
      required: ['task_id', 'worker']
    }
  },
  {
    name: 'complete_task',
    description: '작업 완료를 보고하고 결과를 저장합니다. 작업 완료 후 반드시 호출하세요.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: '완료된 작업 ID' },
        result:  { type: 'string', description: '작업 결과 요약 (무엇을 했는지, 어떤 파일을 수정했는지)' },
        files_modified: { type: 'array', items: { type: 'string' }, description: '실제로 수정된 파일 목록' }
      },
      required: ['task_id', 'result']
    }
  },
  {
    name: 'fail_task',
    description: '작업 실패를 보고합니다. 에러 또는 불가능한 경우 호출.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: '실패한 작업 ID' },
        reason:  { type: 'string', description: '실패 이유' }
      },
      required: ['task_id', 'reason']
    }
  },
  {
    name: 'get_task',
    description: '특정 작업의 상세 정보와 결과를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: '조회할 작업 ID' }
      },
      required: ['task_id']
    }
  },
  {
    name: 'clear_completed',
    description: '완료된 작업들을 목록에서 제거합니다. 작업 목록 정리에 사용.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_summary',
    description: '전체 작업 현황 요약을 반환합니다. 병렬 작업 완료 여부 확인에 사용.',
    inputSchema: { type: 'object', properties: {} }
  }
];

// ─── 도구 실행 핸들러 ─────────────────────────────────────────
function handleTool(name, args) {
  const state = loadState();
  const now = new Date().toISOString();

  switch (name) {
    case 'create_task': {
      const id = `task-${String(state.nextId).padStart(3, '0')}`;
      state.nextId++;
      const task = {
        id,
        title: args.title,
        description: args.description,
        assigned_to: args.assigned_to,
        priority: args.priority || 'medium',
        files: args.files || [],
        depends_on: args.depends_on || [],
        status: 'pending',
        created_at: now,
        started_at: null,
        completed_at: null,
        result: null,
        files_modified: []
      };
      state.tasks.push(task);
      saveState(state);
      return { content: [{ type: 'text', text: `✅ 작업 생성 완료\n\nID: ${id}\n제목: ${task.title}\n담당: ${task.assigned_to}\n우선순위: ${task.priority}\n\n${task.assigned_to === 'cursor' ? '📋 Cursor AI가 이 작업을 pickup하면 자동으로 진행됩니다.' : '🤖 Claude Code가 이 작업을 처리합니다.'}` }] };
    }

    case 'list_tasks': {
      const filter = args.filter || 'all';
      let tasks = state.tasks;
      if (['pending', 'in_progress', 'completed', 'failed'].includes(filter)) {
        tasks = tasks.filter(t => t.status === filter);
      } else if (['claude', 'cursor'].includes(filter)) {
        tasks = tasks.filter(t => t.assigned_to === filter);
      }

      if (tasks.length === 0) {
        return { content: [{ type: 'text', text: `작업 없음 (필터: ${filter})` }] };
      }

      const statusEmoji = { pending: '⏳', in_progress: '🔄', completed: '✅', failed: '❌' };
      const lines = tasks.map(t =>
        `${statusEmoji[t.status]} [${t.id}] ${t.title}\n   담당: ${t.assigned_to} | 우선순위: ${t.priority} | 상태: ${t.status}${t.result ? `\n   결과: ${t.result.substring(0, 100)}...` : ''}`
      );
      return { content: [{ type: 'text', text: `## 작업 목록 (${filter})\n\n${lines.join('\n\n')}` }] };
    }

    case 'start_task': {
      const task = state.tasks.find(t => t.id === args.task_id);
      if (!task) return { content: [{ type: 'text', text: `❌ 작업을 찾을 수 없습니다: ${args.task_id}` }] };
      if (task.assigned_to !== args.worker) {
        return { content: [{ type: 'text', text: `⚠️ 이 작업은 ${task.assigned_to} 담당입니다. ${args.worker}가 시작할 수 없습니다.` }] };
      }
      task.status = 'in_progress';
      task.started_at = now;
      saveState(state);
      return { content: [{ type: 'text', text: `🔄 작업 시작: ${task.id}\n제목: ${task.title}\n\n📋 작업 내용:\n${task.description}${task.files.length ? `\n\n📁 관련 파일:\n${task.files.join('\n')}` : ''}` }] };
    }

    case 'complete_task': {
      const task = state.tasks.find(t => t.id === args.task_id);
      if (!task) return { content: [{ type: 'text', text: `❌ 작업을 찾을 수 없습니다: ${args.task_id}` }] };
      task.status = 'completed';
      task.completed_at = now;
      task.result = args.result;
      task.files_modified = args.files_modified || [];
      saveState(state);

      const remaining = state.tasks.filter(t => t.status !== 'completed' && t.status !== 'failed').length;
      return { content: [{ type: 'text', text: `✅ 작업 완료: ${task.id}\n제목: ${task.title}\n\n결과: ${args.result}${task.files_modified.length ? `\n\n수정 파일:\n${task.files_modified.join('\n')}` : ''}\n\n남은 작업: ${remaining}개` }] };
    }

    case 'fail_task': {
      const task = state.tasks.find(t => t.id === args.task_id);
      if (!task) return { content: [{ type: 'text', text: `❌ 작업을 찾을 수 없습니다: ${args.task_id}` }] };
      task.status = 'failed';
      task.completed_at = now;
      task.result = `실패: ${args.reason}`;
      saveState(state);
      return { content: [{ type: 'text', text: `❌ 작업 실패 보고됨: ${task.id}\n이유: ${args.reason}` }] };
    }

    case 'get_task': {
      const task = state.tasks.find(t => t.id === args.task_id);
      if (!task) return { content: [{ type: 'text', text: `❌ 작업을 찾을 수 없습니다: ${args.task_id}` }] };
      return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] };
    }

    case 'clear_completed': {
      const before = state.tasks.length;
      state.tasks = state.tasks.filter(t => t.status !== 'completed');
      saveState(state);
      return { content: [{ type: 'text', text: `🧹 완료 작업 ${before - state.tasks.length}개 제거됨. 남은 작업: ${state.tasks.length}개` }] };
    }

    case 'get_summary': {
      const total = state.tasks.length;
      const byStatus = { pending: 0, in_progress: 0, completed: 0, failed: 0 };
      const byAgent  = { claude: 0, cursor: 0 };
      state.tasks.forEach(t => {
        byStatus[t.status] = (byStatus[t.status] || 0) + 1;
        byAgent[t.assigned_to] = (byAgent[t.assigned_to] || 0) + 1;
      });
      const done = total > 0 ? Math.round((byStatus.completed / total) * 100) : 0;
      const allDone = byStatus.pending === 0 && byStatus.in_progress === 0;
      return { content: [{ type: 'text', text: `## 병렬 작업 현황\n\n전체: ${total}개\n진행률: ${done}%${allDone && total > 0 ? ' 🎉 모든 작업 완료!' : ''}\n\n상태별:\n  ⏳ 대기: ${byStatus.pending}\n  🔄 진행중: ${byStatus.in_progress}\n  ✅ 완료: ${byStatus.completed}\n  ❌ 실패: ${byStatus.failed}\n\n담당 AI:\n  🤖 Claude: ${byAgent.claude}\n  🖥️ Cursor: ${byAgent.cursor}` }] };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── MCP Protocol Handler (stdio) ─────────────────────────────
const rl = readline.createInterface({ input: process.stdin, terminal: false });

function send(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}
function notify(method, params) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
}

rl.on('line', (raw) => {
  let msg;
  try { msg = JSON.parse(raw.trim()); } catch { return; }

  const { id, method, params } = msg;

  try {
    switch (method) {
      case 'initialize':
        send(id, {
          protocolVersion: '2024-11-05',
          serverInfo: { name: 'parallel-coordinator', version: '1.0.0' },
          capabilities: { tools: {} }
        });
        break;

      case 'notifications/initialized':
      case 'initialized':
        // 알림은 응답 불필요
        break;

      case 'ping':
        send(id, {});
        break;

      case 'tools/list':
        send(id, { tools: TOOLS });
        break;

      case 'tools/call': {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        const result = handleTool(toolName, toolArgs);
        send(id, result);
        break;
      }

      default:
        if (id !== undefined) {
          sendError(id, -32601, `Method not found: ${method}`);
        }
    }
  } catch (err) {
    if (id !== undefined) {
      sendError(id, -32603, err.message);
    }
  }
});

process.stderr.write('[parallel-coordinator] MCP server started\n');
