import { computeDependencies } from './computeDependencies'

import { describe, it, beforeEach } from 'mocha'
import { Document, Node } from 'slimdom'
import * as chai from 'chai'

describe('computeDependencies', () => {
  let document: Document
  beforeEach(() => {
    document = new Document()
  })
  it('Returns no dependencies if there are no path expressions', () => {
    chai.assert.isEmpty(computeDependencies<Node>('true()', document))
  })

  it('Returns a single dependency if there is a single path', () => {
    const element = document.createElement('element')

    element.setAttribute('attribute', 'value')

    chai.assert.sameMembers(Array.from(computeDependencies<Node>('@attribute', element)), [element.getAttributeNode('attribute')])
  })

  it('Returns two dependencies when an "or" is used for a branch', () => {
    const element = document.createElement('element')

    element.setAttribute('first', 'value')
    element.setAttribute('second', 'value')

    chai.assert.sameMembers(Array.from(computeDependencies<Node>('@first or @second', element)), [element.getAttributeNode('first'), element.getAttributeNode('second')])
  })
})
