<script setup lang="ts">
import type { DiffFile } from "../types/diff";

const props = defineProps<{
  files: DiffFile[];
  selectedKeys: string[];
  allPageSelected: boolean;
}>();

const emit = defineEmits<{
  copyPath: [file: DiffFile];
  copyFile: [file: DiffFile];
  reveal: [file: DiffFile];
  toggleSelectAll: [];
  toggleSelect: [file: DiffFile];
}>();

function rowKey(file: DiffFile): string {
  return `${file.status}:${file.path}`;
}
</script>

<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width: 52px">
            <label class="select-cell select-all-cell">
              <input
                type="checkbox"
                :checked="props.allPageSelected"
                :disabled="props.files.length === 0"
                @change="emit('toggleSelectAll')"
              />
            </label>
          </th>
          <th style="width: 88px">状态</th>
          <th style="min-width: 640px">相对路径</th>
          <th style="width: 90px">后缀</th>
          <th style="width: 224px">操作</th>
        </tr>
      </thead>

      <tbody v-if="files.length > 0">
        <tr v-for="file in files" :key="`${file.status}-${file.path}`">
          <td>
            <label class="select-cell">
              <input
                type="checkbox"
                :checked="props.selectedKeys.includes(rowKey(file))"
                @change="emit('toggleSelect', file)"
              />
            </label>
          </td>
          <td>
            <span :class="['badge', file.status]">
              {{
                file.status === "added"
                  ? "新增"
                  : file.status === "deleted"
                    ? "删除"
                    : "修改"
              }}
            </span>
          </td>
          <td class="path-cell"><span class="path">{{ file.path }}</span></td>
          <td>{{ file.ext || "-" }}</td>
          <td>
            <div class="row-actions">
              <button class="btn small" type="button" @click="emit('copyPath', file)">
                复制路径
              </button>
              <button class="btn small copy-file-btn" type="button" @click="emit('copyFile', file)">
                复制文件
              </button>
              <button class="btn small" type="button" @click="emit('reveal', file)">显示</button>
            </div>
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr>
          <td colspan="5" class="table-empty">当前筛选条件下没有文件。</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
