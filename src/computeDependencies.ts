import { parseScript, evaluateXPath, evaluateXPathToNodes, Node } from 'fontoxpath'

import { DependencyTrackingDomFacade } from './DependencyTrackingDomFacade'
import { Document as SlimdomDocument, Node as SlimdomNode } from 'slimdom'

const XQUERY_X_NAMESPACE_URI = 'http://www.w3.org/2005/XQueryX'
/**
* Determine all the nodes that influence the result of an XPath. For branches, this algorithm takes all of them to determine a set of depencencies that will change as litle as possible. When the structure of a document is changed (ie by adding new subtrees), the XPath may also change its return. This is not reflected in the dependency set
*/
export function computeDependencies<TNode extends Node> (xpath: string, contextItem: TNode): Set<TNode> {
  const doc = new SlimdomDocument()
  const moduleElement = doc.createElementNS(XQUERY_X_NAMESPACE_URI, 'module')
  const mainModuleScratch = moduleElement.appendChild(doc.createElementNS(XQUERY_X_NAMESPACE_URI, 'mainModule'))
    .appendChild(doc.createElementNS(XQUERY_X_NAMESPACE_URI, 'queryBody'))

  // Simple for now: disregard any places where we use variables (such as FLWOR expressions)
  const ast = parseScript(xpath, {}, doc)

  const pathExpressions = evaluateXPathToNodes<SlimdomNode>('descendant::*:pathExpr (: => outermost():)', ast)

  // These paths: just execute them to get the paths to the nodes they want to use
  const allDependencies = new Set<TNode>()
  const dependencyTrackingDomFacade = new DependencyTrackingDomFacade((node: TNode) => allDependencies.add(node))

  pathExpressions.forEach((pathExpression) => {
    mainModuleScratch.appendChild(pathExpression)
    const nodes = evaluateXPathToNodes<TNode>(moduleElement, contextItem, dependencyTrackingDomFacade)
    nodes.forEach(node => allDependencies.add(node))
    mainModuleScratch.removeChild(pathExpression)
  })

  return allDependencies
};

/**
* Compute the depencencies from an XPath by running it and seeing which nodes it touches
*/
export function computeMinimalDependencies<TNode extends Node> (xpath: string, contextItem: TNode): Set<TNode> {
  const allDependencies = new Set<TNode>()
  const dependencyTrackingDomFacade = new DependencyTrackingDomFacade((node: TNode) => allDependencies.add(node))

  evaluateXPath(xpath, contextItem, dependencyTrackingDomFacade)

  return allDependencies
};
