const express = require('express');
const http = require('http');
const mysql = require('mysql');
const MySQLEvents = require('@rodrigogs/mysql-events');
const app = express();
const server = http.createServer(app);
const cors = require('cors');
const socketIO = require('socket.io');
const io = socketIO.listen(server);
const {database} = require('./config/helpers');

// Middlewares
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));


// Define some array variables
let data = Array(0);
let currentData = Array(0);

// Use Sockets to setup the connection
io.sockets.on('connection', (socket) => {
    database.table('products')
        .withFields(['id', 'title', 'quantity', 'price'])
        .sort({id: -1})
        .getAll()
        .then(prods => {
            data = prods;
            io.sockets.emit('initial', {prods: [...data]});
        })
        .catch(err => console.log(err));
});

const program = async () => {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456'
    });

    // Create MySQLEvents
    const instance = new MySQLEvents(connection, {
        startAtEnd: true  // to record only new binary logs
    });

    await instance.start();

    instance.addTrigger({
        name: 'Monitor all SQL Statements',
        expression: 'mega_shop.*',  // listen to mega_shop database
        statement: MySQLEvents.STATEMENTS.ALL,
        onEvent: e => {
            currentData = e.affectedRows;

            let newData;

            switch (e.type) {
                case "DELETE":
                    // Assign current event (before) data to the newData variable
                    newData = currentData[0].before;

                    // Find index of the deleted product in the current array, if it was there
                    let index = data.findIndex(p => p.id === newData.id);

                    // If product is present, index will be gt -1
                    if (index > -1) {
                        data = data.filter(p => p.id !== newData.id);
                        io.sockets.emit('update', {prods: [...data], type: "DELETE"});
                    } else {
                        return;
                    }
                    break;

                case "UPDATE":
                    newData = currentData[0].after;

                    // Find index of the deleted product in the current array, if it was there
                    let index2 = data.findIndex(p => p.id === newData.id);

                    // If product is present, index will be gt -1
                    if (index2 > -1) {
                        data[index2] = newData;
                        io.sockets.emit('update', {prods: [...data], type: "DELETE"});
                    } else {
                        return;
                    }
                    break;

                case "INSERT":
                    database.table('products')
                        .withFields(['id', 'title', 'quantity', 'price'])
                        .sort({id: -1})
                        .getAll()
                        .then(prods => {
                            data = prods;
                            io.sockets.emit('initial', {prods: [...data]});
                        })
                        .catch(err => console.log(err));
                    break;
                default:
                    break;
            }
        }
    });

    instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
    instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);

};

program().then();


server.listen(3000, () => {
    console.log('Server running on port 3000');
})


