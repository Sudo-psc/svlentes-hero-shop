# CodeRabbit AI Code Review Integration

**Integration Date**: 2025-10-18
**Status**: ✅ Configured and Ready
**Documentation**: https://docs.coderabbit.ai/

---

## Overview

CodeRabbit AI is an automated code review tool that provides intelligent, context-aware code reviews on every pull request. It analyzes code changes, identifies potential issues, suggests improvements, and posts inline comments directly on GitHub.

### Key Benefits

✅ **Automated Code Review** - AI-powered analysis on every PR
✅ **Inline Comments** - Specific, actionable feedback on code changes
✅ **Context-Aware** - Understands project structure and domain requirements
✅ **Security Focus** - Identifies security vulnerabilities and compliance issues
✅ **Best Practices** - Enforces coding standards and architectural patterns
✅ **Healthcare Compliance** - Configured for LGPD and healthcare regulations

---

## How It Works

### Automatic Workflow

```
Developer creates PR
        ↓
CI Pipeline runs (lint, test, build)
        ↓
CI Summary posted to PR
        ↓
CodeRabbit AI Review triggered
        ↓
AI analyzes all changed files
        ↓
Inline comments posted on specific lines
        ↓
Summary comment with overview
        ↓
Developer addresses feedback
        ↓
AI responds to conversations
```

### Review Triggers

CodeRabbit automatically reviews PRs when:
- New PR is opened
- New commits are pushed to an existing PR
- PR is reopened after being closed
- Review comments are added (AI responds)

### What CodeRabbit Reviews

**Code Quality**:
- Code complexity and readability
- Naming conventions and consistency
- Code duplication and reusability
- TypeScript type safety
- React best practices
- Performance optimization opportunities

**Security**:
- Authentication and authorization issues
- Input validation and sanitization
- SQL injection risks (even with Prisma)
- XSS vulnerabilities
- Sensitive data exposure
- LGPD compliance violations
- Healthcare data protection (PHI/PII)

**Architecture**:
- Component structure and organization
- API design and error handling
- Database schema and migrations
- Integration patterns
- Error boundaries and handling

**Testing**:
- Test coverage gaps
- Edge case handling
- Test isolation and independence
- Accessibility testing

**Accessibility**:
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- ARIA attributes
- Semantic HTML

---

## Configuration

### Workflow Files

**Primary Review Workflow**: `.github/workflows/coderabbit-review.yml`
- Triggers on PR open, update, reopen
- Posts inline comments and summary
- Handles conversation responses
- Integrates with CI pipeline

**CI Integration**: `.github/workflows/ci.yml`
- Includes CI summary job
- References CodeRabbit in status comments
- Coordinates review workflow

### Configuration File

**Location**: `.coderabbit.yaml`

**Key Settings**:
```yaml
language: en-US
tone: Professional and constructive

reviews:
  auto_review: true
  high_level_summary: true
  review_status: true

ai:
  model: gpt-4o              # Complex analysis
  light_model: gpt-4o-mini   # Simple changes
  temperature: 0.3           # Consistent reviews

enable:
  - security_review
  - performance_review
  - best_practices
  - documentation_review
  - accessibility_review
  - test_coverage_review
```

### Path-Specific Instructions

CodeRabbit applies specialized review criteria based on file paths:

| Path | Focus Areas |
|------|-------------|
| `src/app/api/**` | API security, authentication, LGPD compliance, error handling, rate limiting |
| `src/components/**` | React best practices, accessibility, performance, TypeScript typing |
| `**/*.test.*` | Test coverage, edge cases, isolation, accessibility testing |
| `.github/workflows/**` | Workflow security, performance, error handling, caching |
| `src/lib/**` | Code reusability, error handling, type safety, documentation |
| `prisma/**` | Schema best practices, migrations, indexes, LGPD compliance |

### Knowledge Base

CodeRabbit is configured with domain-specific context:

**Regulatory Requirements**:
- LGPD (Brazilian Data Protection Law)
- Healthcare regulations (CFM/CRM)
- Medical credential validation (CRM-MG 69.870)
- Prescription validation requirements

**Technology Stack**:
- Next.js 15 with App Router
- TypeScript 5.9 (strict mode)
- Prisma ORM + PostgreSQL
- Asaas payment integration
- SendPulse WhatsApp integration

**Quality Standards**:
- Zero security vulnerabilities
- 85%+ test coverage
- WCAG 2.1 AA accessibility
- Performance budgets

---

## Setup Instructions

### Prerequisites

1. **GitHub Repository Access**
   - Admin or write access to repository
   - GitHub Actions enabled

2. **Required Secrets**
   - `GITHUB_TOKEN` - Automatically provided by GitHub Actions
   - `OPENAI_API_KEY` - OpenAI API key for AI reviews

### Installation Steps

#### Step 1: Add OpenAI API Key

1. Go to GitHub repository Settings
2. Navigate to **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secret:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-`)
5. Click **Add secret**

#### Step 2: Enable GitHub Actions Permissions

1. Go to repository Settings
2. Navigate to **Actions** → **General**
3. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
4. Under **Pull Request**, check:
   - ✅ **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

#### Step 3: Verify Installation

1. Create a test branch:
   ```bash
   git checkout -b test/coderabbit-setup
   ```

2. Make a small change (e.g., update a comment)

3. Commit and push:
   ```bash
   git add .
   git commit -m "test: verify CodeRabbit integration"
   git push origin test/coderabbit-setup
   ```

4. Create a Pull Request on GitHub

5. Wait for workflows to complete (~2-3 minutes)

6. Check for:
   - ✅ CI Pipeline Results comment
   - ✅ CodeRabbit AI Review Summary comment
   - ✅ Inline comments on changed lines (if applicable)

#### Step 4: First PR Review

When CodeRabbit reviews your first PR, you'll see:

1. **CI Summary Comment**:
   ```
   ## ✅ CI Pipeline Results
   | Check | Status |
   | Lint & Type Check | ✅ success |
   | Unit Tests | ✅ success |
   ...
   🤖 Next Step: CodeRabbit AI will review this PR automatically.
   ```

2. **CodeRabbit Analysis Comment**:
   ```
   ## 🤖 CodeRabbit AI Review Summary
   CodeRabbit has completed its analysis...
   Reviews Posted: 1
   Status: ✅ Analysis complete
   ```

3. **Inline Comments** (on specific lines):
   - Suggestions for improvements
   - Security concerns
   - Best practice recommendations
   - Performance optimizations

---

## Using CodeRabbit

### Understanding Review Comments

**Comment Types**:

1. **🔒 Security Issues** (High Priority)
   - Authentication/authorization problems
   - Input validation missing
   - Sensitive data exposure
   - LGPD compliance violations

2. **⚡ Performance Issues** (Medium Priority)
   - Inefficient algorithms
   - Unnecessary re-renders
   - N+1 query problems
   - Bundle size concerns

3. **♿ Accessibility Issues** (Medium Priority)
   - Missing ARIA attributes
   - Keyboard navigation problems
   - Color contrast issues
   - Screen reader incompatibility

4. **💡 Best Practices** (Low Priority)
   - Code organization suggestions
   - Naming improvements
   - Type safety enhancements
   - Documentation additions

### Responding to Reviews

**Option 1: Accept and Implement**
```
✅ Good catch! Implemented the suggestion in commit abc123
```

**Option 2: Discuss and Clarify**
```
@coderabbitai Can you explain why this approach is better?
```

**Option 3: Disagree with Reasoning**
```
I chose this approach because [reason]. In this context, it's acceptable because [explanation].
```

### Interactive Conversations

CodeRabbit can respond to questions and engage in discussions:

**Ask for Explanation**:
```
@coderabbitai Why is this a security concern?
```

**Request Alternative**:
```
@coderabbitai Can you suggest a better way to implement this?
```

**Clarify Context**:
```
@coderabbitai This is required for LGPD compliance. Does that change your assessment?
```

---

## Best Practices

### For Developers

1. **Read Reviews Carefully**
   - CodeRabbit provides context-specific feedback
   - Consider healthcare and compliance context
   - Don't dismiss security warnings

2. **Address Critical Issues First**
   - Security vulnerabilities (🔒)
   - LGPD compliance issues
   - Healthcare data protection concerns
   - Authentication/authorization problems

3. **Engage in Discussions**
   - Ask for clarifications
   - Explain your reasoning
   - Learn from the feedback

4. **Update and Re-review**
   - Push updates to address feedback
   - CodeRabbit will automatically re-review
   - Verify issues are resolved

### For Reviewers

1. **Use CodeRabbit as First Pass**
   - Let AI identify common issues
   - Focus human review on logic and architecture
   - Verify AI suggestions make sense

2. **Don't Rely Solely on AI**
   - Human review still essential
   - Business logic requires human understanding
   - Context may not be fully understood by AI

3. **Verify Compliance Issues**
   - Double-check LGPD concerns
   - Validate healthcare regulations
   - Confirm security assessments

---

## Customization

### Adjusting Review Behavior

**Modify `.coderabbit.yaml`** to customize:

**Review Tone**:
```yaml
tone_instructions: "Be brief and focus only on critical issues"
```

**Enable/Disable Features**:
```yaml
enable:
  - security_review      # Always enabled
  - performance_review   # Optional
  - accessibility_review # Optional
```

**Path Filters**:
```yaml
path_filters:
  exclude:
    - "scripts/**"       # Exclude utility scripts
    - "docs/**"          # Exclude documentation
```

**AI Model Selection**:
```yaml
ai:
  model: gpt-4o         # Premium model for complex analysis
  light_model: gpt-4o-mini  # Faster model for simple changes
  temperature: 0.3      # Lower = more consistent
```

### Custom Prompts

Add domain-specific prompts in `.coderabbit.yaml`:

```yaml
prompts:
  lgpd_check: |
    Check for LGPD compliance:
    - User consent collection
    - Data minimization
    - Right to deletion
    - Audit trail

  healthcare_check: |
    Check for healthcare compliance:
    - CRM credential validation
    - Prescription validation
    - Emergency information
    - Medical data protection
```

---

## Troubleshooting

### Common Issues

#### 1. CodeRabbit Not Commenting

**Symptoms**: No AI review comments on PR

**Solutions**:
- Verify `OPENAI_API_KEY` secret is set
- Check workflow permissions (read/write)
- Review workflow logs for errors
- Ensure PR has actual code changes
- Check if changes match `path_filters`

#### 2. Workflow Failing

**Symptoms**: `coderabbit-review.yml` shows failure

**Solutions**:
```bash
# Check workflow logs
gh run list --workflow=coderabbit-review.yml
gh run view [run-id] --log-failed

# Common fixes:
- Verify OPENAI_API_KEY format (starts with sk-)
- Check GitHub token permissions
- Review rate limiting (10 reviews/hour)
```

#### 3. Too Many Comments

**Symptoms**: CodeRabbit posts excessive comments

**Solutions**:
```yaml
# In .coderabbit.yaml
integrations:
  github:
    max_inline_comments: 10  # Reduce from 25

reviews:
  auto_review:
    enabled: true
    auto_incremental_review: true  # Only review new changes
```

#### 4. Irrelevant Suggestions

**Symptoms**: AI suggests changes that don't fit context

**Solutions**:
- Update `knowledge_base` in `.coderabbit.yaml`
- Add path-specific instructions
- Engage in discussion to clarify context
- Use `tone_instructions` to focus on priorities

### Getting Help

**CodeRabbit Documentation**: https://docs.coderabbit.ai/
**GitHub Actions Docs**: https://docs.github.com/en/actions
**OpenAI API Issues**: https://platform.openai.com/docs

**Internal Support**:
- Review `claudedocs/CICD_WORKFLOWS.md` for CI/CD guidance
- Check GitHub Actions logs for detailed errors
- Consult `CLAUDE.md` for project-specific context

---

## Cost Considerations

### OpenAI API Usage

**Estimated Costs**:
```
Small PR (< 100 lines):  ~$0.05 - $0.10
Medium PR (100-500 lines): ~$0.20 - $0.50
Large PR (500+ lines):    ~$0.80 - $2.00
```

**Monthly Estimates**:
```
10 PRs/month: ~$3 - $10
20 PRs/month: ~$6 - $20
50 PRs/month: ~$15 - $50
```

**Optimization**:
- Use `gpt-4o-mini` for simple changes (cheaper)
- Enable `review_simple_changes: false` to skip trivial PRs
- Set `auto_incremental_review: true` for efficiency
- Configure rate limiting to control costs

### Cost Management

**In `.coderabbit.yaml`**:
```yaml
reviews:
  auto_review:
    ignore_title_keywords:
      - "WIP"           # Skip work in progress
      - "DRAFT"         # Skip draft PRs
      - "NO REVIEW"     # Manual skip

rate_limiting:
  max_reviews_per_hour: 10  # Control API usage
  cooldown_seconds: 60      # Delay between reviews
```

---

## Integration with Existing Workflows

### CI Pipeline Coordination

CodeRabbit integrates seamlessly with existing CI:

```
1. Developer creates PR
2. CI workflow runs (lint, test, build)
3. CI summary posted
4. CodeRabbit review starts
5. Both workflows complete independently
6. Developer sees all feedback together
```

### Security Scanning

CodeRabbit complements existing security tools:

| Tool | Focus | Timing |
|------|-------|--------|
| **npm audit** | Dependency vulnerabilities | Every CI run |
| **Kluster** | Code security & quality | On code changes |
| **CodeRabbit** | Security patterns & best practices | Every PR |

### Code Review Process

**Updated Process**:
```
1. Developer creates PR
2. CI + CodeRabbit review automatically
3. Developer addresses automated feedback
4. Human reviewer focuses on:
   - Business logic
   - Architecture decisions
   - Complex algorithms
   - User experience
5. Approve and merge
```

---

## Performance Metrics

### Expected Outcomes

**Review Speed**:
- Small PRs: 30-60 seconds
- Medium PRs: 1-3 minutes
- Large PRs: 3-5 minutes

**Review Quality**:
- Security issues caught: ~90%
- Best practice violations: ~85%
- Accessibility issues: ~80%
- False positives: ~5-10%

**Developer Impact**:
- Faster feedback loops
- Consistent code quality
- Reduced human review time
- Better learning opportunities

---

## Success Criteria

### Measuring Effectiveness

**Quantitative Metrics**:
- Number of PRs reviewed
- Issues caught before human review
- Reduction in post-merge bugs
- Time saved in code review

**Qualitative Metrics**:
- Developer satisfaction
- Code quality improvement
- Learning and skill development
- Compliance adherence

### Goals

**Short-term (1 month)**:
- ✅ CodeRabbit reviewing 100% of PRs
- ✅ Security issues caught early
- ✅ Developer familiarity with tool

**Medium-term (3 months)**:
- ✅ Measurable code quality improvement
- ✅ Reduced manual review time
- ✅ Enhanced team learning

**Long-term (6 months)**:
- ✅ Sustained high code quality
- ✅ Zero critical security issues in production
- ✅ Efficient code review process

---

## Maintenance

### Regular Updates

**Weekly**:
- Review CodeRabbit feedback quality
- Adjust configuration as needed
- Monitor OpenAI API costs

**Monthly**:
- Analyze review effectiveness metrics
- Update `knowledge_base` with new context
- Refine path-specific instructions

**Quarterly**:
- Evaluate ROI and cost-effectiveness
- Survey developer satisfaction
- Consider model upgrades (GPT-4o variants)

### Configuration Refinement

As the project evolves, update `.coderabbit.yaml`:

**New Features**:
```yaml
knowledge_base:
  - "New feature X requires specific validation..."
```

**New Integrations**:
```yaml
path_instructions:
  - path: "src/integrations/new-service/**"
    instructions: "Focus on..."
```

**Changed Standards**:
```yaml
prompts:
  updated_standard: "Check for new coding standard..."
```

---

## Appendix

### Example Review Comments

**Security Issue**:
```
🔒 Security Concern: Potential SQL Injection

This query concatenates user input without validation.
Even with Prisma, this pattern is risky.

Suggested fix:
- Use Prisma's parameterized queries
- Validate input with Zod schema
- Implement input sanitization

Reference: OWASP SQL Injection Prevention
```

**Performance Issue**:
```
⚡ Performance: Unnecessary Re-renders

This component will re-render on every parent update
due to inline function creation.

Suggested fix:
- Use useCallback for handler functions
- Memoize child components with React.memo
- Consider useMemo for expensive calculations

Impact: 30-50% reduction in re-renders
```

**Accessibility Issue**:
```
♿ Accessibility: Missing ARIA Label

This button lacks accessible labeling for screen readers.

Required for WCAG 2.1 AA compliance.

Suggested fix:
- Add aria-label attribute
- Or use aria-labelledby with visible text
- Ensure keyboard navigation works

Reference: WCAG 2.1 Success Criterion 4.1.2
```

### Workflow Examples

**Example PR Timeline**:
```
10:00 AM - PR created by developer
10:01 AM - CI workflow starts
10:03 AM - CI workflow completes (✅ All checks passed)
10:03 AM - CI Summary posted
10:04 AM - CodeRabbit review starts
10:06 AM - CodeRabbit posts 5 inline comments
10:06 AM - CodeRabbit posts summary comment
10:15 AM - Developer addresses 3 suggestions
10:16 AM - Developer discusses 2 comments
10:30 AM - CodeRabbit responds to questions
11:00 AM - Human reviewer approves
11:05 AM - PR merged
```

---

**Integration Status**: ✅ Active and Configured
**Last Updated**: 2025-10-18
**Documentation Version**: 1.0
