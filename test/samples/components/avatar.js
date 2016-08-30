import eventMixin from '../mixins/event';
import stateMixin from '../mixins/state';

export default {
    name: 'avatar',

    constructor(opts) {
        this.first = ko.observable(opts.first);
        this.last = ko.observable(opts.last);
    },

    defaults: {
        first: 'first',
        last: 'last'
    },

    mixins: [
        eventMixin,
        stateMixin
    ],

    methods: {
        ready() {
        },

        rename(newFirst, newLast) {
            this.first(newFirst);
            this.last(newLast);
        }
    },

    computed: {
        full() {
            return `${this.first()} ${this.last()}`;
        }
    },

    pureComputed: {
        full2() {
            return `${this.first()} ${this.last()}`;
        }
    },

    style: `
        .avatar {
            color: red;
        }
    `,

    template: `
        <span class="avatar">
            <span class="avatar-first" data-bind="text: first"></span>
            <span class="avatar-last" data-bind="text: last"></span>
            <span class="avatar-full" data-bind="text: full"></span>
            <span class="avatar-full2" data-bind="text: full2"></span>
        </span>
    `
};