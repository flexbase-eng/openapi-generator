import { ParsedNode, compareParameters, comparePrimatives, isParameter, isPrimative } from './parsed_nodes';

export const compareParsedNodes = (nodeA?: ParsedNode, nodeB?: ParsedNode): boolean => {
  if (nodeA === undefined) {
    return nodeB === undefined;
  }
  if (nodeB === undefined) {
    return false;
  }

  if (isParameter(nodeA) && isParameter(nodeB)) {
    return compareParameters(nodeA, nodeB, compareParsedNodes);
  } else if (isPrimative(nodeA) && isPrimative(nodeB)) {
    return comparePrimatives(nodeA, nodeB, compareParsedNodes);
  }

  return false;
};
