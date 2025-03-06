const Card = {
    props: {
        title: String,
        list: Array,
        column: Number,
        index: Number,
        moveCard: Function,
        completedAt: String,
        updateCard: Function,
        totalCardsInSecondColumn: Number,
    },
    data() {
        return {
            draggedItemIndex: null,
        };
    },
    computed: {
        completed() {
            const completedItems = this.list.filter(item => item.done).length;
            return Math.floor((completedItems / this.list.length) * 100);
        },
        isBlocked() {
            return this.column === 1 && this.totalCardsInSecondColumn >= 5 && this.completed < 100;
        }
    },
    methods: {
        checkItem(index) {
            if (this.isBlocked) return;
            const completedItems = this.list.filter(item => item.done).length;
            const completed = Math.floor((completedItems / this.list.length) * 100);
            if (completed === 100 && !this.completedAt) {
                const completedTime = new Date().toLocaleString();
                this.updateCard(this.index, this.column, { completedAt: completedTime });
            }

            if (this.column === 1 && completed > 50) {
                this.moveCard({ column: this.column, index: this.index }, 2);
            } else if (this.column === 2 && completed === 100) {
                this.moveCard({ column: this.column, index: this.index }, 3);
            }
            this.$root.checkBlockFirstColumn();
        },
        // Добавляем методы для drag-and-drop внутри списка
        dragStartItem(event, index) {
            this.draggedItemIndex = index;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', index);
        },
        dragOverItem(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            return false;
        },
        dropItem(event) {
            const targetIndex = event.target.closest('li').dataset.index;
            if (this.draggedItemIndex !== null && targetIndex !== null) {
                const newIndex = parseInt(targetIndex);
                const movedItem = this.list.splice(this.draggedItemIndex, 1)[0];
                this.list.splice(newIndex, 0, movedItem);
                this.updateCard(this.index, this.column, { list: this.list }); // Обновляем данные
            }
            this.draggedItemIndex = null;
            return false;
        },
        dragEndItem() {
            this.draggedItemIndex = null;
        }
    },
    template: `
        <div class="card" @dragover.stop @drop.stop>
            <h3>{{ title }}</h3>
            <ul>
                <li 
                    v-for="(item, index) in list" 
                    :key="index" 
                    :data-index="index"
                    draggable="true"
                    @dragstart="(e) => dragStartItem(e, index)"
                    @dragover="dragOverItem"
                    @drop="dropItem"
                    @dragend="dragEndItem"
                >
                    <input 
                        type="checkbox" 
                        v-model="item.done" 
                        @change="checkItem(index)" 
                        :disabled="item.done || isBlocked"
                    />
                    {{ item.text }}
                </li>
            </ul>
            <p v-if="completed === 100">Completed at: {{ completedAt }}</p>
        </div>
    `,
};

const Column = {
    props: {
        columnNumber: Number,
        cards: Array,
        moveCard: Function,
        updateCard: Function,
        totalCardsInSecondColumn: Number,
    },
    components: { Card },
    template: `
        <div class="column">
            <h2>Column {{ columnNumber }}</h2>
            <div v-for="(card, index) in cards" :key="index">
                <Card
                  :title="card.title"
                  :list="card.list"
                  :column="columnNumber"
                  :index="index"
                  :completedAt="card.completedAt"
                  :moveCard="moveCard"
                  :updateCard="updateCard"
                  :totalCardsInSecondColumn="totalCardsInSecondColumn"
                />
            </div>
        </div>
    `,
};

const app = new Vue({
    el: '#app',
    data() {
        return {
            newCard: {
                title: '',
                list: ['', '', ''],
                completedAt: null,
            },
            columns: [
                { cards: JSON.parse(localStorage.getItem('column1')) || [] },
                { cards: JSON.parse(localStorage.getItem('column2')) || [] },
                { cards: JSON.parse(localStorage.getItem('column3')) || [] },
            ],
            blockFirstColumn: false,
        };
    },
    methods: {
        updateCard(index, column, data) {
            Vue.set(this.columns[column - 1].cards[index], 'completedAt', data.completedAt);
            this.saveData();
        },
        moveCard(cardIndex, columnIndex) {
            const card = this.columns[cardIndex.column - 1].cards.splice(cardIndex.index, 1)[0];
            this.columns[columnIndex - 1].cards.push(card);
            this.saveData();
            this.checkBlockFirstColumn();
        },
        checkBlockFirstColumn() {
            const secondColumnFull = this.columns[1].cards.length >= 5;
            const firstColumnHasProgressingCard = this.columns[0].cards.some(card => {
                const completedItems = card.list.filter(item => item.done).length;
                return Math.floor((completedItems / card.list.length) * 100) > 50;
            });
            if (secondColumnFull && firstColumnHasProgressingCard) {
                this.blockFirstColumn = true;
            } else if (this.columns[1].cards.length < 5) {
                this.blockFirstColumn = false;
            }
        },
        moveAllCardsToLastColumn() {
            this.columns.forEach((column, columnIndex) => {
                if (columnIndex !== 2) {
                    column.cards.forEach(card => {
                        this.columns[2].cards.push(card);
                    });
                    column.cards = [];
                }
            });
            this.saveData();
        },
        saveData() {
            localStorage.setItem('column1', JSON.stringify(this.columns[0].cards));
            localStorage.setItem('column2', JSON.stringify(this.columns[1].cards));
            localStorage.setItem('column3', JSON.stringify(this.columns[2].cards));
        },
        addItem() {
            if (this.newCard.list.length < 5) {
                this.newCard.list.push('');
            }
        },
        removeItem(index) {
            if (this.newCard.list.length > 3) {
                this.newCard.list.splice(index, 1);
            }
        },
        addNewCard() {
            if (this.blockFirstColumn) {
                alert('Первый столбец заблокирован, пока во втором не появится свободное место');
                return;
            }
            if (this.newCard.title.trim() && this.newCard.list.every(item => item.trim())) {
                const newCard = {
                    title: this.newCard.title,
                    list: this.newCard.list.map(text => ({ text, done: false })),
                };
                if (this.columns[0].cards.length < 3) {
                    this.columns[0].cards.push(newCard);
                    console.log('New card added:', newCard);
                } else {
                    alert('В первом храниться не более 3-х карточек!');
                }
                this.saveData();
                this.newCard = { title: '', list: ['', '', '', ''] };
            } else {
                alert('Введите заголовок и минимум 3 пункта!');
            }
        },
        deleteAllCards() {
            if (confirm('Вы уверены, что хотите удалить все \n' +
                'заметки? Это действие нельзя отменить.')) {
                this.columns = [
                    { cards: [] },
                    { cards: [] },
                    { cards: [] },
                ];
                this.saveData();
                alert('Все заметки удалены.');
            }
        },
    },
    components: { Column },
    template: `
    <div id="app">
        <div>
            <h2>Create a new note</h2>
            <form @submit.prevent="addNewCard">
                <div>
                    <label for="title">Title:</label>
                    <input v-model="newCard.title" id="title" type="text" required />
                </div>
                <div>
                    <label>Items (min 3, max 5):</label>
                    <div v-for="(item, index) in newCard.list" :key="index">
                        <input v-model="newCard.list[index]" type="text" :placeholder="'Item ' + (index + 1)" required />
                        <button v-if="newCard.list.length > 3" type="button" @click="removeItem(index)">✖</button>
                    </div>
                    <button v-if="newCard.list.length < 5" type="button" @click="addItem">Add item</button>
                </div>
                <button type="submit" :disabled="blockFirstColumn">Add Note</button>
            </form>
        </div>
        <div>
            <button @click="moveAllCardsToLastColumn" :disabled="blockFirstColumn">
                Перенести все карточки в последний столбец
            </button>
            <button @click="deleteAllCards">
                Удалить все заметки
            </button>
        </div>
        <div class="columns-container">
            <Column
                v-for="(column, index) in columns"
                :key="index"
                :columnNumber="index + 1"
                :cards="column.cards"
                :moveCard="moveCard"
                :updateCard="updateCard"
                :totalCardsInSecondColumn="columns[1].cards.length"
            />
        </div>
    </div>
    `,
});