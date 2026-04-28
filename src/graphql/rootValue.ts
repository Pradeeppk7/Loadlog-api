import { mutationResolvers } from './mutationResolvers';
import { queryResolvers } from './queryResolvers';

export const rootValue = {
  ...queryResolvers,
  ...mutationResolvers,
};
