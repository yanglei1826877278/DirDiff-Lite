<script setup lang="ts">
import type { DiffFile } from "../types/diff";

defineProps<{
  files: DiffFile[];
}>();

const emit = defineEmits<{
  copy: [file: DiffFile];
  reveal: [file: DiffFile];
}>();
</script>

<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width: 88px">状态</th>
          <th>相对路径</th>
          <th style="width: 90px">后缀</th>
          <th style="width: 104px">操作</th>
        </tr>
      </thead>

      <tbody v-if="files.length > 0">
        <tr v-for="file in files" :key="`${file.status}-${file.path}`">
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
          <td><span class="path">{{ file.path }}</span></td>
          <td>{{ file.ext || "-" }}</td>
          <td>
            <div class="row-actions">
              <button class="btn small" type="button" @click="emit('copy', file)">复制</button>
              <button class="btn small" type="button" @click="emit('reveal', file)">显示</button>
            </div>
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr>
          <td colspan="4" class="table-empty">当前筛选条件下没有文件。</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
