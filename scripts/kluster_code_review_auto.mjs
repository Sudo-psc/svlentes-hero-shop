#!/usr/bin/env node
import { spawn } from 'node:child_process';

const args = new Set(process.argv.slice(2));

if (args.has('--help') || args.has('-h')) {
  console.log(`Usage: kluster_code_review_auto [options]\n\n` +
    `Runs the standard code quality checks used in place of the Kluster automation.\n\n` +
    `Options:\n` +
    `  --no-lint    Skip the ESLint verification\n` +
    `  --no-test    Skip unit tests (Jest)\n` +
    `  --no-build   Skip the production build step\n` +
    `  --help, -h   Show this message`);
  process.exit(0);
}

const steps = [];

if (!args.has('--no-lint')) {
  steps.push({
    label: 'Running ESLint checks',
    command: 'npm',
    commandArgs: ['run', 'lint'],
  });
}

if (!args.has('--no-test')) {
  steps.push({
    label: 'Executing unit tests',
    command: 'npm',
    commandArgs: ['run', 'test', '--', '--runInBand'],
  });
}

if (!args.has('--no-build')) {
  steps.push({
    label: 'Building production bundle',
    command: 'npm',
    commandArgs: ['run', 'build'],
  });
}

async function runSteps(queue) {
  for (const step of queue) {
    console.log(`\n▶ ${step.label}`);
    await new Promise((resolve, reject) => {
      const child = spawn(step.command, step.commandArgs, {
        stdio: 'inherit',
        env: process.env,
      });

      child.on('error', reject);

      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          const error = new Error(`${step.label} failed with exit code ${code ?? 'unknown'}`);
          error.exitCode = code ?? 1;
          reject(error);
        }
      });
    });
  }
}

runSteps(steps)
  .then(() => {
    if (steps.length === 0) {
      console.log('No checks were executed. All steps were skipped.');
    } else {
      console.log('\n✅ Kluster fallback verification completed successfully.');
    }
  })
  .catch((error) => {
    console.error(`\n❌ ${error.message}`);
    process.exit(error.exitCode ?? 1);
  });
