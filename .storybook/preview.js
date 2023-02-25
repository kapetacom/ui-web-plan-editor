import '../src/index.less';
import { configure } from 'mobx';
window['__DEV__'] = true;
configure({
    useProxies: 'always',
    enforceActions: 'always',
    computedRequiresReaction: true,
    reactionRequiresObservable: true,
    observableRequiresReaction: true,
    disableErrorBoundaries: true,
});
