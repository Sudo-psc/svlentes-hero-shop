#!/bin/bash
set -e

# Parse arguments
JSON_OUTPUT=false
FEATURE_DESC=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    *)
      FEATURE_DESC="$1"
      shift
      ;;
  esac
done

if [ -z "$FEATURE_DESC" ]; then
  echo "Error: No feature description provided" >&2
  exit 1
fi

# Generate branch and file names from feature description
BRANCH_NAME=$(echo "$FEATURE_DESC" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-50)
BRANCH_NAME="feature/$BRANCH_NAME"

# Create feature directory
FEATURE_DIR="specs/$(echo "$FEATURE_DESC" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-40)"
mkdir -p "$FEATURE_DIR/checklists"

SPEC_FILE="$PWD/$FEATURE_DIR/spec.md"

# Create and checkout branch
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

# Create empty spec file
touch "$SPEC_FILE"

# Output result
if [ "$JSON_OUTPUT" = true ]; then
  echo "{\"BRANCH_NAME\":\"$BRANCH_NAME\",\"SPEC_FILE\":\"$SPEC_FILE\",\"FEATURE_DIR\":\"$PWD/$FEATURE_DIR\"}"
else
  echo "Branch: $BRANCH_NAME"
  echo "Spec file: $SPEC_FILE"
  echo "Feature directory: $FEATURE_DIR"
fi
