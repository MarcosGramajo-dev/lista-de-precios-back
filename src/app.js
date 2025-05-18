import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import itemRoutes from './routes/item.routes.js';
import columnRoutes from './routes/column.routes.js'; // nuevo import

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/items', itemRoutes);
app.use('/api/columns', columnRoutes); // ruta nueva separada

export default app;
