import { getBucketsForNode, IDomFacade, Node, Element, Attr, Document, Text, ProcessingInstruction, Comment } from 'fontoxpath'

/**
 * A DomFacade that will intercept any and all accesses to _nodes_ from an XPath. Basically the same
 * as the `depends` function, but less explicit and will automatically be called for any node that
 * will be touched in the XPath.
 *
 * Maybe some more granularity is better. Maybe only notify a node's attributes are touched?
 */
export class DependencyTrackingDomFacade<TNode extends Node> implements IDomFacade {
    private _onNodeTouched: (node: TNode) => void;
    /**
   * @param  onNodeTouched - A function what will be executed whenever a node is 'touched' by the XPath
   */
    constructor (onNodeTouched: (node: TNode) => void) {
      this._onNodeTouched = onNodeTouched
    }

    /**
   * Get all attributes of this element.
   * The bucket can be used to narrow down which attributes should be retrieved.
   *
   * @param  node -
   */
    getAllAttributes (node: Element & {attributes: Attr[]}) {
      return Array.from(node.attributes) as Attr[]
    }

    /**
   * Get the value of specified attribute of this element.
   *
   * @param  node -
   * @param  attributeName -
   */
    getAttribute (node: Element & {getAttribute(name: string): string}, attributeName: string): string {
      return node.getAttribute(attributeName)
    }

    /**
   * Get all child nodes of this element.
   * The bucket can be used to narrow down which child nodes should be retrieved.
   *
   * @param  node -
   * @param  bucket - The bucket that matches the attribute that will be used.
   */
    getChildNodes (node: (Element|Document) & {childNodes: Node[]}, bucket?: string): Node[] {
      const matchingNodes = Array.from(node.childNodes).filter(
        childNode => !bucket || getBucketsForNode(childNode).includes(bucket)
      )
      return matchingNodes
    }

    /**
   * Get the data of this node.
   *
   * @param  node -
   */
    getData (node: Text|Comment|ProcessingInstruction|Attr) {
      if (node.nodeType === 2) {
        this._onNodeTouched(node as unknown as TNode)
        return (node as Attr).value
      }
      // Text node
      this._onNodeTouched((node as ((Comment|Text|ProcessingInstruction) & {parentNode: Node})).parentNode as TNode)
      return ((node as (Comment|Text|ProcessingInstruction) & {data: string})).data
    }

    /**
   * Get the first child of this element.
   * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
   *
   * @param  node -
   * @param  bucket - The bucket that matches the attribute that will be used.
   */
    getFirstChild (node: (Element|Document) &{childNodes: Node[]}, bucket: string) {
      const matchingNode = Array.from(this.getChildNodes(node)).filter(
        childNode => !bucket || getBucketsForNode(childNode).includes(bucket)
      )[0]
      if (matchingNode) {
        return matchingNode
      }
      return null
    }

    /**
   * Get the last child of this element.
   * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
   *
   * @param  node -
   * @param  bucket - The bucket that matches the attribute that will be used.
   */
    // eslint-disable-next-line class-methods-use-this
    getLastChild (node: (Element|Document) &{childNodes: Node[]}, bucket: string) {
      const matchingNodes = this.getChildNodes(node)
        .filter(childNode => !bucket || getBucketsForNode(childNode).includes(bucket))
      const matchNode = matchingNodes[matchingNodes.length - 1]
      if (matchNode) {
        return matchNode
      }
      return null
    }

    /**
   * Get the next sibling of this node
   * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
   *
   * @param  node -
   * @param  bucket - The bucket that matches the nextSibling that is requested.
   */
    getNextSibling (node: Node & {nextSibling: Node}, bucket: string) {
      for (
        let nextSibling = node.nextSibling as Node & {nextSibling: Node};
        nextSibling;
        nextSibling = nextSibling.nextSibling as Node & {nextSibling: Node}
      ) {
        if (!getBucketsForNode(nextSibling).includes(bucket)) {
        // eslint-disable-next-line no-continue
          continue
        }
        return nextSibling
      }
      return null
    }

    /**
   * Get the parent of this element.
   * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
   *
   * @param  node -
   * @param  bucket - The bucket that matches the attribute that will be used.
   */
    getParentNode (node: Node & {parentNode: Node}) {
      return node.parentNode
    }

    /**
   * Get the previous sibling of this element.
   * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
   *
   * @param  node -
   * @param  bucket - The bucket that matches the attribute that will be used.
   */
    getPreviousSibling (node: Node & {previousSibling: Node}, bucket: string) {
      for (
        let previousSibling = node.previousSibling as Node & {previousSibling: Node};
        previousSibling;
        previousSibling = previousSibling.previousSibling as Node & {previousSibling: Node}
      ) {
        if (!getBucketsForNode(previousSibling).includes(bucket)) {
          continue
        }

        return previousSibling
      }
      return null
    }
};
