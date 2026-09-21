import type { DeterministicGoalFixture, GoalClarificationRequirement, GoalPlanV1 } from '../src';

export const PUBLISH_ARTICLE_GOAL_MARKDOWN = `# 发布微信公众号文章

把准备好的文章发布到微信公众号。
需要标题、正文和封面，摘要可选。
如果需要登录或安全验证，让我接管。
正式发布前让我确认。
只有真正发布成功才算完成，保存草稿不算完成。`;

export const UPDATED_PUBLISH_ARTICLE_GOAL_MARKDOWN = `${PUBLISH_ARTICLE_GOAL_MARKDOWN}
发布失败时保留原始内容并告诉我原因。`;

export const AMBIGUOUS_PUBLISH_GOAL_MARKDOWN = `# 发布内容

把准备好的内容发布到公众号。`;

export const PUBLISH_ARTICLE_GOAL_PLAN = {
  intent: '把准备好的文章发布到微信公众号，并以平台确认发布成功作为完成标准。',
  semanticCapabilities: ['content.publish'],
  requiredInputs: [
    {
      key: 'title',
      label: '文章标题',
      description: '要发布的文章标题。',
      kind: 'text',
    },
    {
      key: 'content',
      label: '文章正文',
      description: '要发布的文章正文。',
      kind: 'document',
    },
    {
      key: 'cover',
      label: '封面',
      description: '与文章配套的封面图片。',
      kind: 'image',
    },
  ],
  optionalInputs: [
    {
      key: 'summary',
      label: '摘要',
      description: '平台支持时使用的文章摘要。',
      kind: 'text',
    },
  ],
  successCriteria: ['平台明确显示文章已经成功发布。'],
  nonSuccessCriteria: ['仅保存为草稿。', '提交动作完成但平台没有确认发布成功。'],
  confirmationPolicy: {
    trigger: 'BEFORE_IRREVERSIBLE_ACTION',
    mode: 'REQUIRE_EXPLICIT_CONFIRMATION',
    rationale: '正式发布是面向外部的不可逆动作。',
  },
  interventionPolicy: {
    loginRequired: 'REQUEST_HUMAN',
    securityChallenge: 'STOP_AND_REQUEST_HUMAN',
    ambiguousState: 'REQUEST_CLARIFICATION',
  },
} satisfies GoalPlanV1;

export const UPDATED_PUBLISH_ARTICLE_GOAL_PLAN = {
  ...PUBLISH_ARTICLE_GOAL_PLAN,
  nonSuccessCriteria: [
    ...PUBLISH_ARTICLE_GOAL_PLAN.nonSuccessCriteria,
    '发布失败时必须保留原始内容并报告原因。',
  ],
} satisfies GoalPlanV1;

export const PUBLISH_GOAL_CLARIFICATION = {
  kind: 'CHOICE',
  prompt: '你希望发布哪种公众号内容？',
  options: [
    { key: 'article', label: '发布文章' },
    { key: 'video', label: '发布视频' },
  ],
} satisfies GoalClarificationRequirement;

export const HAPPY_PATH_FIXTURES = [
  {
    markdown: PUBLISH_ARTICLE_GOAL_MARKDOWN,
    outcome: { kind: 'draft', value: PUBLISH_ARTICLE_GOAL_PLAN },
  },
  {
    markdown: UPDATED_PUBLISH_ARTICLE_GOAL_MARKDOWN,
    outcome: { kind: 'draft', value: UPDATED_PUBLISH_ARTICLE_GOAL_PLAN },
  },
  {
    markdown: AMBIGUOUS_PUBLISH_GOAL_MARKDOWN,
    outcome: { kind: 'clarification', requirement: PUBLISH_GOAL_CLARIFICATION },
  },
] satisfies readonly DeterministicGoalFixture[];
