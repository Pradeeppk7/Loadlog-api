import { buildSchema } from 'graphql';
import { rootValue } from './rootValue';
import { typeDefs } from './typeDefs';

export const schema = buildSchema(typeDefs);

export { rootValue };
