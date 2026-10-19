import { WorkspaceLeaf } from 'obsidian';
import type TabGroupsPlugin from './main';

// ✨ "그룹 탭 잠금": 그룹에 속한 탭을 고정(pin)해 노트가 바뀌지 않게 합니다.
// 고정된 탭에서 링크를 열면 옵시디언이 새 탭(그룹 밖)에 열어 줍니다. 그 탭을 그룹에 넣으면 그 탭도 잠깁니다.
// 💡 이 플러그인이 고정한 탭만 기억해, 사용자가 직접 고정한 탭은 그룹에서 빠져도 그대로 둡니다.
export class GroupLock {
    private lockedLeaves = new WeakSet<WorkspaceLeaf>();

    constructor(private plugin: TabGroupsPlugin) {}

    // 💡 그룹이나 설정이 바뀔 때마다 부릅니다. 그룹에 속한 탭은 고정하고, 그룹에서 빠진 탭은 (우리가 고정했던 것만) 풉니다.
    sync() {
        this.plugin.app.workspace.iterateAllLeaves(leaf => {
            const shouldLock = this.plugin.settings.lockGroupedTabs && this.plugin.leafGroupMap.has(leaf);
            if (shouldLock) this.lock(leaf);
            else this.unlock(leaf);
        });
    }

    // 💡 설정을 끄거나 플러그인을 끌 때: 우리가 고정한 탭을 모두 풉니다.
    releaseAll() {
        this.plugin.app.workspace.iterateAllLeaves(leaf => this.unlock(leaf));
    }

    // 💡 재시작 후 이미 고정된 그룹 탭은 이 플러그인이 고정한 것으로 보고 이어받습니다. (고정 상태는 옵시디언이 저장함)
    adoptExisting() {
        if (!this.plugin.settings.lockGroupedTabs) return;
        this.plugin.app.workspace.iterateAllLeaves(leaf => {
            if (this.plugin.leafGroupMap.has(leaf) && leaf.getViewState().pinned) this.lockedLeaves.add(leaf);
        });
    }

    private lock(leaf: WorkspaceLeaf) {
        if (leaf.getViewState().pinned) return; // 이미 고정됨 (직접 고정한 탭이면 우리 것으로 세지 않음)
        leaf.setPinned(true);
        this.lockedLeaves.add(leaf);
    }

    private unlock(leaf: WorkspaceLeaf) {
        if (!this.lockedLeaves.has(leaf)) return;
        this.lockedLeaves.delete(leaf);
        leaf.setPinned(false);
    }
}
