const app = new Vue({
    el: '#app',
    data() {
        return {
            columns: [
                {cards: JSON.parse(localStorage.getItem('column1')) || []},
                {cards: JSON.parse(localStorage.getItem('column2')) || []},
                {cards: JSON.parse(localStorage.getItem('column3')) || []},
            ],
            blockFirstColumn: false,
        };
    },
    methods: {
        moveCard(cardIndex, columnIndex) {
            const card = this.columns[cardIndex.column - 1].cards.splice(cardIndex.index, 1)[0];
            this.columns[columnIndex - 1].cards.push(card);
            this.saveData();
        },
        saveData() {
            localStorage.setItem('column1', JSON.stringify(this.columns[0].cards));
            localStorage.setItem('column2', JSON.stringify(this.columns[1].cards));
            localStorage.setItem('column3', JSON.stringify(this.columns[2].cards));
        },
    },
    components: {
        Card: {
            props: {
                title: String,
                list: Array,
                column: Number,
                index: Number,
                moveCard: Function,
            },
            data() {
                return {
                    completed: 0,
                    completedAt: null,
                };
            },
            methods: {
                checkItem(index) {
                    const completedItems = this.list.filter(item => item.done).length;
                    this.completed = Math.floor((completedItems / this.list.length) * 100);

                    if (this.completed === 100) {
                        this.completedAt = new Date().toLocaleString();
                    }

                    if (this.column === 1 && this.completed > 50) {
                        this.moveCard({ column: this.column, index: this.index }, 2);
                    } else if (this.column === 2 && this.completed === 100) {
                        this.moveCard({ column: this.column, index: this.index }, 3);
                    }
                },
            },
            template: `
                <div class="card">
                    <h3>{{ title }}</h3>
                    <ul>
                        <li v-for="(item, index) in list" :key="index">
                          <input type="checkbox" v-model="item.done" @change="checkItem(index)" />
                          {{ item.text }}
                        </li>
                    </ul>
                    <p v-if="completed === 100">Completed at: {{ completedAt }}</p>
                </div>
               `,
        },
        Column: {
            props: {
                columnNumber: Number,
                cards: Array,
                moveCard: Function,
            },
            template: `
                <div class="column">
                    <h2>Column {{ columnNumber }}</h2>
                    <div v-for="(card, index) in cards" :key="index">
                        <Card
                          :title="card.title"
                          :list="card.list"
                          :column="columnNumber"
                          :index="index"
                          :moveCard="moveCard"
                        />
                    </div>
                </div>
            `,
        },
    },
    template: `
    <div id="app">
      <Column
        v-for="(column, index) in columns"
        :key="index"
        :columnNumber="index + 1"
        :cards="column.cards"
        :moveCard="moveCard"
      />
    </div>
  `,
});