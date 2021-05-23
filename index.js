import { walktree } from './treewalker.js';


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
      viewingDirectory: null,
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
      async keyDownEventHandler(e) {
        if(!this.viewingFile) return;
        if(!this.viewingFile.value.parent) return;
        const viewingDirectory = this.viewingFile.value.parent;
        const viewingIdx = viewingDirectory.children.indexOf(this.viewingFile);
        let processed = true;
        switch(e.key) {
          case 'ArrowLeft':
            this.viewingFile = await this.nextFile(-1);
            break;
          case 'ArrowRight':
            this.viewingFile = await this.nextFile(1);
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
        const handle = await window.showDirectoryPicker();
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
        for await (const entry of directory.value.handle.values()) {
          const type = entry.kind;
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
      async nextFile(delta) {
        let viewingFileTreeEntry = null;
        const createTreewalkerTree = (entry, parent) => {
          const ret = {
            parent,
            value: {
              entry,
            },
          };
          if(entry.value.type === 'file') {
            ret.children = false;
          } else if(entry.value.type === 'directory') {
            if(entry.children)
              ret.children = entry.children.map(x => createTreewalkerTree(x, ret));
            else
              ret.children = true;
            ret.expandChildren = async () => {
              if(!entry.children)
                await this.expandDirectoryEntries(entry);
              ret.children = entry.children.map(x => createTreewalkerTree(x, ret));
            };
          }

          if(entry === this.viewingFile)
            viewingFileTreeEntry = ret;

          return ret;
        }
        
        const tree = createTreewalkerTree(this.viewingDirectory, null);
        return (await walktree(viewingFileTreeEntry, delta)).value.entry;
      },
      viewFile(file) {
        this.viewingFile = file;        
        this.viewingDirectory = file.value.parent;
      },
      requestFullscreen(element) {
        element.requestFullscreen();
      },
    },
  });  
});
