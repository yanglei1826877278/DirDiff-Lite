<script setup lang="ts">
import AppTopbar from "../components/AppTopbar.vue";
import { useCompareStore } from "../stores/compareStore";

const store = useCompareStore();
</script>

<template>
  <section class="page-shell">
    <AppTopbar
      eyebrow="Preferences"
      title="默认设置"
      subtitle="保存常用后缀、忽略目录和比较方式。保持工具简单，但每次打开都顺手。"
      :busy="store.state.isSavingSettings"
    >
      <template #actions>
        <button class="btn danger" type="button" @click="store.resetSettingsDraft">恢复默认</button>
        <button class="btn primary" type="button" @click="store.saveSettings">保存设置</button>
      </template>
    </AppTopbar>

    <section class="layout">
      <section class="panel">
        <div class="panel-header">
          <div class="panel-title">默认比较规则</div>
          <div class="panel-desc">
            自用工具最重要的是下次打开不用重新填。这里保存你的常用后缀和忽略目录。
          </div>
        </div>

        <div class="panel-body">
          <div class="setting-row">
            <div>
              <h3>默认后缀</h3>
              <p>只比较你关心的代码、页面和配置文件。</p>
            </div>
            <textarea v-model="store.state.settingsDraft.includeExtInput"></textarea>
          </div>

          <div class="setting-row">
            <div>
              <h3>忽略目录</h3>
              <p>跳过构建产物、依赖目录、IDE 配置和缓存。</p>
            </div>
            <textarea v-model="store.state.settingsDraft.ignoreDirInput"></textarea>
          </div>

          <div class="setting-row">
            <div>
              <h3>比较方式</h3>
              <p>发布前检查建议默认使用 Hash。</p>
            </div>

            <div class="mode-row mode-row-tight">
              <button
                :class="['mode-card', { active: store.state.settingsDraft.compareMode === 'fast' }]"
                type="button"
                @click="store.state.settingsDraft.compareMode = 'fast'"
              >
                <strong>快速比较</strong>
                <span>大小 + 修改时间</span>
              </button>

              <button
                :class="['mode-card', { active: store.state.settingsDraft.compareMode === 'hash' }]"
                type="button"
                @click="store.state.settingsDraft.compareMode = 'hash'"
              >
                <strong>精确 Hash</strong>
                <span>读取文件内容判断</span>
              </button>
            </div>
          </div>

          <div class="setting-row">
            <div>
              <h3>默认导出文件名</h3>
              <p>导出 TXT 报告时默认使用的文件名。</p>
            </div>
            <input v-model="store.state.settingsDraft.exportFileName" />
          </div>

          <div class="submit-row">
            <button class="btn danger" type="button" @click="store.resetSettingsDraft">恢复默认</button>
            <button class="btn primary" type="button" @click="store.saveSettings">保存设置</button>
          </div>
        </div>
      </section>

      <aside>
        <section class="panel">
          <div class="panel-header">
            <div class="panel-title">内置预设</div>
            <div class="panel-desc">这些预设可以直接复用到开始比较页。</div>
          </div>
          <div class="panel-body">
            <div class="preset-list">
              <div v-for="preset in store.presets" :key="preset.id" class="preset">
                <div>
                  <strong>{{ preset.label }}</strong>
                  <span>{{ preset.summary }}</span>
                </div>
                <div class="check"></div>
              </div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div class="panel-title">本地优先</div>
            <div class="panel-desc">不上传文件，不登录账号，不同步数据。设置也只保存在本机。</div>
          </div>
          <div class="panel-body">
            <div class="summary-list">
              <div><span>账号系统</span><span class="value">无</span></div>
              <div><span>云同步</span><span class="value">无</span></div>
              <div><span>网络请求</span><span class="value">无</span></div>
            </div>
          </div>
        </section>
      </aside>
    </section>
  </section>
</template>
