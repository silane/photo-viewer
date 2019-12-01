function divmod(a, b) {
  const q = Math.floor(a / b);
  return [q, a - b * q];
}

window.addEventListener('DOMContentLoaded', e => {
  Vue.component('v-tree', {
    template: '#tree-template',
    props: {
      item: {
        type: Object,
        required: true,
      },
    },
  });

  new Vue({
    el: '#app',
    data() { return {
      rootDirectory: null,
      viewingFile: null,
      viewingFileURL: null,
      viewerZoomSource: 0,
    }; },
    created() {
      document.addEventListener('keydown', e => this.keyDownEventHandler(e));
    },
    beforeDestroy() {
    },
    watch: {
      async viewingFile() {
        if(!this.viewingFile)
          return null;
        this.viewingFileURL = window.URL.createObjectURL(
          await this.viewingFile.value.handle.getFile()
        );
      },
    },
    computed: {
      viewerZoom() {
        return 2 ** (this.viewerZoomSource * 0.1);
      },
    },
    methods: {
      keyDownEventHandler(e) {
        if(!this.viewingFile) return;
        if(!this.viewingFile.value.parent) return;
        const viewingDirectory = this.viewingFile.value.parent;
        const viewingIdx = viewingDirectory.children.indexOf(this.viewingFile);
        let processed = true;
        switch(e.key) {
          case 'ArrowLeft':
            for(let idx = viewingIdx - 1;; --idx) {
              idx = divmod(idx, viewingDirectory.children.length)[1];
              if(idx === viewingIdx)
                break;
              const item = viewingDirectory.children[idx];
              if(item.value.type !== 'file')
                continue;
              this.viewingFile = item;
              break;
            }
            break;
          case 'ArrowRight':
            for(let idx = viewingIdx + 1;; ++idx) {
              idx = divmod(idx, viewingDirectory.children.length)[1];
              if(idx === viewingIdx)
                break;
              const item = viewingDirectory.children[idx];
              if(item.value.type !== 'file')
                continue;
              this.viewingFile = item;
              break;
            }
            break;
          case 'ArrowUp':
            this.viewerZoomSource += 1;
            break;
          case 'ArrowDown':
            this.viewerZoomSource -= 1;
            break;
          default:
            processed = false;
        }
        if(processed) {
          e.preventDefault();
        }
      },
      async selectRootDirectory() {
        const opts = {type: 'openDirectory'};
        const handle = await window.chooseFileSystemEntries(opts);
        const rootEntry = {
          value: {
            handle,
            type: 'directory',
            name: handle.name,
            parent: null,
          },
          children: null,
          isOpen: true,
        };
        await this.expandDirectoryEntries(rootEntry);
        this.viewingFile = null;
        this.rootDirectory = rootEntry;
      },
      async expandDirectoryEntries(directory) {
        if(directory.value.type !== 'directory')
          return;
        const children = [];
        for await (const entry of directory.value.handle.getEntries()) {
          const type = entry.isFile ? 'file' : 'directory';
          children.push({
            value: {
              handle: entry,
              type,
              name: entry.name,
              parent: directory,
            },
            children: null,
            isOpen: false,
          });
        }
        directory.children = [...children.filter(x => x.value.type === 'directory'),
                              ...children.filter(x => x.value.type !== 'directory')];
      },
      async viewImageFile(file) {
        this.viewingFile = file;        
      },
      requestFullscreen(element) {
        element.requestFullscreen();
      },
    },
  });  
});
