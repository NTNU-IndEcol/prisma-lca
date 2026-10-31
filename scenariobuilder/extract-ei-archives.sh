#!/usr/bin/env bash
set -euo pipefail

shopt -s nullglob
archives=(./eisource/ecoinvent*.7z)

if [ "${#archives[@]}" -eq 0 ]; then
    echo "No ecoinvent archives found in ./eisource" >&2
    exit 1
fi

expected_version=""

for archive_path in "${archives[@]}"; do
    archive_file="$(basename "$archive_path")"
    if [[ "$archive_file" =~ ^ecoinvent[[:space:]]+([0-9.]+)_ ]]; then
        current_version="${BASH_REMATCH[1]}"
    else
        echo "Unable to determine version for $archive_file" >&2
        exit 1
    fi

    if [ -z "$expected_version" ]; then
        expected_version="$current_version"
    elif [ "$current_version" != "$expected_version" ]; then
        echo "Version mismatch: expected ${expected_version}, but ${archive_file} has ${current_version}" >&2
        exit 1
    fi

    dataset_name="${archive_file%.7z}"
    output_dir="./eisource/${dataset_name}"

    echo "Extracting ${archive_path} -> ${output_dir}"
    7z x "$archive_path" -o"$output_dir"
done
