import Breadcrumb from "./Breadcrumb.js";
import Nodes from "./Nodes.js";
import ImageView from "./ImageView.js";
import Loading from "./Loading.js";

import { getNodeData } from "../modules/api.js";

const cache = {};

export default function App($app) {
  this.state = {
    isRoot: false,
    nodes: [],
    path: [],
    selectedFilePath: null,
    loading: false,
  };

  const breadcrumb = new Breadcrumb({
    $app,
    initialState: [],
    onClick: (index) => {
      if (index === this.state.path.length - 1) {
        return;
      }

      if (index === null) {
        this.setState({
          ...this.state,
          path: [],
          isRoot: true,
          nodes: cache.rootNode,
        });
        return;
      }

      const nextPath = this.state.path.slice(0, index + 1);

      this.setState({
        ...this.state,
        path: nextPath,
        nodes: cache[nextPath[index].id],
      });
    },
  });

  const nodes = new Nodes({
    $app,
    initialState: [],
    onClick: async (node) => {
      try {
        this.setState({
          ...this.state,
          loading: true,
        });
        switch (node.type) {
          case "DIRECTORY":
            if (cache[node.id]) {
              this.setState({
                ...this.state,
                isRoot: false,
                path: [...this.state.path, node],
                nodes: cache[node.id],
                loading: false,
              });
              return;
            }
            const nextNodes = await getNodeData(node.id);
            this.setState({
              ...this.state,
              isRoot: false,
              path: [...this.state.path, node],
              nodes: nextNodes,
              loading: false,
            });
            cache[node.id] = nextNodes;
            break;
          case "FILE":
            this.setState({
              ...this.state,
              isRoot: false,
              selectedFilePath: node.filePath,
              loading: false,
            });
        }
      } catch (e) {
        // 에러처리하기
      }
    },
    onBackClick: async () => {
      try {
        const nextState = { ...this.state };
        nextState.path.pop();

        const isRoot = nextState.path.length === 0;
        const prevNodeId = isRoot
          ? null
          : nextState.path[nextState.path.length - 1].id;
        this.setState({
          ...nextState,
          isRoot,
          nodes: isRoot ? cache.rootNode : cache[prevNodeId],
        });
      } catch (e) {
        // 에러처리하기
      }
    },
  });

  const imageView = new ImageView({
    $app,
    initialState: this.state.selectedFilePath,
    onClose: () => {
      this.setState({
        ...this.state,
        selectedFilePath: null,
      });
    },
  });

  const loading = new Loading({
    $app,
    initialState: this.state.loading,
  });

  this.setState = (nextState) => {
    this.state = nextState;
    breadcrumb.setState(this.state.path);
    nodes.setState({
      isRoot: this.state.isRoot,
      nodes: this.state.nodes,
    });
    imageView.setState(this.state.selectedFilePath);
    loading.setState(this.state.loading);
  };

  const init = async () => {
    try {
      this.setState({
        ...this.state,
        isRoot: true,
        loading: true,
      });
      const rootNode = await getNodeData();
      this.setState({
        ...this.state,
        isRoot: true,
        nodes: rootNode,
      });

      cache.rootNode = rootNode;
    } catch (e) {
      // 에러처리 하기
    } finally {
      this.setState({
        ...this.state,
        loading: false,
      });
    }
  };

  init();
}
