#!/bin/bash
set -e

# Parse arguments
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Get current branch
BRANCH=$(git branch --show-current)

# Find feature directory from branch name
FEATURE_SLUG=$(echo "$BRANCH" | sed 's/feature\///')
SPECS_DIR="$PWD/specs"

# Find matching spec directory
FEATURE_DIR=$(find "$SPECS_DIR" -maxdepth 1 -type d -name "*${FEATURE_SLUG:0:20}*" | head -1)

if [ -z "$FEATURE_DIR" ]; then
  echo "Error: No feature directory found for branch $BRANCH" >&2
  exit 1
fi

FEATURE_SPEC="$FEATURE_DIR/spec.md"
IMPL_PLAN="$FEATURE_DIR/plan.md"

# Create plan.md from template if it doesn't exist
if [ ! -f "$IMPL_PLAN" ]; then
  if [ -f ".specify/templates/plan-template.md" ]; then
    cp ".specify/templates/plan-template.md" "$IMPL_PLAN"
  else
    touch "$IMPL_PLAN"
  fi
fi

# Output result
if [ "$JSON_OUTPUT" = true ]; then
  echo "{\"BRANCH\":\"$BRANCH\",\"FEATURE_SPEC\":\"$FEATURE_SPEC\",\"IMPL_PLAN\":\"$IMPL_PLAN\",\"SPECS_DIR\":\"$SPECS_DIR\",\"FEATURE_DIR\":\"$FEATURE_DIR\"}"
else
  echo "Branch: $BRANCH"
  echo "Feature Spec: $FEATURE_SPEC"
  echo "Implementation Plan: $IMPL_PLAN"
  echo "Specs Directory: $SPECS_DIR"
  echo "Feature Directory: $FEATURE_DIR"
fi
