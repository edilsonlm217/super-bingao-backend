import { Router } from 'express';

import UserController from './app/controllers/UserController';
import EventController from './app/controllers/EventController';
import OrderController from './app/controllers/OrderController';
import WinnerController from './app/controllers/WinnerController';
import SearchController from './app/controllers/SearchController';
import SessionController from './app/controllers/SessionController';
import ProductController from './app/controllers/ProductController';
import ValidatedCardController from './app/controllers/ValidatedCardController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.post('/session', SessionController.store);
routes.post('/winner', WinnerController.show);
routes.get('/events/all', EventController.index);

routes.use(authMiddleware);
routes.post('/users', UserController.store);

routes.post('/event', EventController.store);
routes.get('/events', EventController.show);

routes.post('/validate', ValidatedCardController.store);
routes.get('/validateds', ValidatedCardController.show);

routes.get('/orders', OrderController.index);
routes.put('/order', OrderController.update);

routes.get('/search', SearchController.index);

routes.post('/product', ProductController.update);

export default routes;