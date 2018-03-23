import Animate from '../mixin/animate';

function plugin(UIkit) {

    UIkit.use(Animate);

    const {util, mixin} = UIkit;
    const {$$, $, append, assign, css, data, each, hasClass, isUndefined, matches, parseOptions, toggleClass, toNodes} = util;

    if (plugin.installed) {
        return;
    }

    UIkit.component('filter', {

        mixins: [mixin.animate],

        props: {
            container: Boolean,
            selActive: Boolean
        },

        defaults: {
            container: null,
            selActive: false,
            attrItem: 'uk-filter-item',
            cls: 'uk-active',
            animation: 250
        },

        computed: {

            toggles({attrItem}, $el) {
                return $$(`[${this.attrItem}],[data-${this.attrItem}]`, $el);
            },

            container({container}, $el) {
                return $(container, $el);
            }

        },

        events: [

            {

                name: 'click',

                delegate() {
                    return `[${this.attrItem}],[data-${this.attrItem}]`;
                },

                handler(e) {

                    e.preventDefault();
                    this.apply(e.current);

                }

            }

        ],

        connected() {

            if (this.selActive === false) {
                return;
            }

            const actives = $$(this.selActive, this.$el);
            this.toggles.forEach(el => toggleClass(el, this.cls, includes(actives, el)));
        },

        update(data) {

            const {toggles, children} = data;
            if (isEqualList(toggles, this.toggles, false) && isEqualList(children, this.container.children, false)) {
                return;
            }

            data.toggles = this.toggles;
            data.children = this.container.children;

            this.setState(this.getState(), false);

        },

        methods: {

            apply(el) {
                this.setState(mergeState(el, this.attrItem, this.getState()));
            },

            getState() {
                return this.toggles
                    .filter(item => hasClass(item, this.cls))
                    .reduce((state, el) => mergeState(el, this.attrItem, state), {filter: {'': ''}, sort: []});
            },

            setState(state, animate = true) {

                const children = toNodes(this.container.children);

                state = assign({filter: {'': ''}, sort: []}, state);

                this.toggles.forEach(el => toggleClass(el, this.cls, matchFilter(el, this.attrItem, state)));

                const apply = () => {

                    const selector = getSelector(state);

                    children.forEach(el => css(el, 'display', selector && !matches(el, selector) ? 'none' : ''));

                    const [sort, order] = state.sort;

                    if (sort) {
                        const sorted = sortItems(children, sort, order);
                        if (!isEqualList(sorted, children)) {
                            sorted.forEach(el => append(this.container, el));
                        }
                    }

                };

                animate ? this.animate(apply) : apply();

            }

        }

    });

    function getFilter(el, attr) {
        return parseOptions(data(el, attr), ['filter']);
    }

    function mergeState(el, attr, state) {

        toNodes(el).forEach(el => {
            const filterBy = getFilter(el, attr);
            const {filter, group, sort, order = 'asc'} = filterBy;

            if (filter || isUndefined(sort)) {

                if (group) {
                    delete state.filter[''];
                    state.filter[group] = filter;
                } else {
                    state.filter = {'': filter};
                }

            }

            if (!isUndefined(sort)) {
                state.sort = [sort, order];
            }
        });

        return state;
    }

    function matchFilter(el, attr, {filter: stateFilter, sort: [stateSort, stateOrder]}) {
        const {filter, group = '', sort, order = 'asc'} = getFilter(el, attr);
        return Boolean(
            (filter || isUndefined(sort)) && group in stateFilter && (filter === stateFilter[group] || isUndefined(filter) && !stateFilter[group])
            || stateSort && sort && stateSort === sort && stateOrder === order
        );
    }

    function isEqualList(listA, listB, strict = true) {

        listA = toNodes(listA);
        listB = toNodes(listB);

        return listA.length === listB.length
            && listA.every((el, i) => strict ? el === listB[i] : ~listB.indexOf(el));
    }

    function getSelector({filter}) {
        let selector = '';
        each(filter, value => selector += value || '');
        return selector;
    }

    function sortItems(nodes, sort, order) {
        return toNodes(nodes).sort((a, b) => data(order === 'asc' ? a : b, sort).localeCompare(data(order === 'asc' ? b : a, sort)));
    }

}

if (!BUNDLED && typeof window !== 'undefined' && window.UIkit) {
    window.UIkit.use(plugin);
}

export default plugin;
