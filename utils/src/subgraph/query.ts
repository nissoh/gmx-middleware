import { SolidityAddress, SolidityArrayWithoutTuple, SolidityBool, SolidityBytes, SolidityInt, SolidityString } from "abitype"
import { request } from "graphql-request"
import { abiParamParseMap } from "../gmxUtils.js"
import { getMappedValue } from "../utils.js"
import { filter } from "@most/core/dist/combinator/filter.js"

export { encodePacked } from 'viem'

export type GqlType<T extends string> = { __typename: T }

type PackedAbiType =
  | SolidityAddress
  | SolidityBool
  | SolidityBytes
  | SolidityInt
  | SolidityString
  | SolidityArrayWithoutTuple

export type ISchema<T extends GqlType<any>> = {
  [P in keyof T]: T[P] extends any[] ? any : T[P] extends GqlType<any> ? ISchema<T[P]> : P extends `__typename` ? string : PackedAbiType
}

export type ISchemaQuery<TSchema, TQuery> = {
  [P in keyof TQuery]: TQuery[P] extends any[]
    ? P extends keyof TSchema ? ISchemaQuery<TSchema[P], TQuery[P]> : never : TQuery[P] extends object
      ? P extends keyof TSchema ? ISchemaQuery<TSchema[P], TQuery[P]> : never : P extends keyof TSchema
        ? TSchema[P] : never
}

export type PrettifyReturn<T> = {
  [K in keyof T]: T[K];
} & {};





interface IQuerySubgraph <Type extends GqlType<any>, TQuery>{
  schema: ISchema<Type>
  document?: TQuery | undefined
  filter?: any
  url: string
  startBlock?: bigint
}

export const querySubgraph = <Type extends GqlType<any>, TQuery>(
  params: IQuerySubgraph<Type, TQuery>
): Promise<TQuery extends unknown ? Type[] : PrettifyReturn<ISchemaQuery<Type, TQuery>>[]> => {

  const typeName = params.schema.__typename as string
  const whereClause = parseWhereClause(params.filter)
  const fieldStructure = parseQueryObject(params.document ? params.document : fillQuery(params.schema))
  const graphDocumentIdentifier = `${typeName.charAt(0).toLowerCase() + typeName.slice(1)}s`

  const changeBlockFilterParam = params.startBlock ? ` _change_block: { number_gte: ${params.startBlock} }, ` : ''

  const entry = `${graphDocumentIdentifier}(first: 1000, where: { ${changeBlockFilterParam} ${whereClause} }) { ${fieldStructure} }`


  const newLogsFilter = request({
    document: `{ ${entry} }`,
    url: params.url
  })
    .then((x: any) => {

      if (!(graphDocumentIdentifier in x)) {
        throw new Error(`No ${graphDocumentIdentifier} found in subgraph response`)
      }

      const list: PrettifyReturn<ISchemaQuery<Type, TQuery>>[] = x[graphDocumentIdentifier]

      if (list instanceof Array) {
        return list.map(item => parseResults(item, params.schema))
      }

      throw new Error(`No ${graphDocumentIdentifier} found in subgraph response`)
    })

  return newLogsFilter as any
}


// recursively parse a json object to query result
function parseResults(json: any, schema: any) {
  const entity: any = {}
  Object.entries(json).forEach(([key, value]) => {
    const schemaField = schema[key]

    if (typeof value === 'string') {
      if (key === '__typename') {
        entity[key] = value
        return
      }

      const abiType = schemaField
      const parseFn = getMappedValue(abiParamParseMap, abiType)

      entity[key] = parseFn(value)
    } else if(value instanceof Array) {
      entity[key] = value.map((item, i) => parseResults(item, schemaField))
    } else if(value instanceof Object) {
      entity[key] = parseResults(value, schemaField )
    } else {
      entity[key] = value
    }

  })
  return entity
}

function parseQueryObject(query: any) {
  const fields: string[] = []
  Object.entries(query).forEach(([key, value]) => {

    if (value instanceof Object) {
      fields.push(`${key} { ${parseQueryObject(value)} }`)
    } else {
      fields.push(key)
    }

  })
  return fields.join(' ')
}

function parseWhereClause(query?: object) {
  if (query === undefined) return ''

  const where: string[] = []

  Object.entries(query).forEach(([key, value]) => {
    const valueFormatted = typeof value === 'string' ? `"${value}"` : String(value)

    where.push(`${key}: ${valueFormatted}`)
    
  })

  return where.join(', ')
}

function fillQuery(obj: any){
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key]
    acc[key] = value instanceof Object ? fillQuery(value) : null
    return acc
  }, {} as any)
}