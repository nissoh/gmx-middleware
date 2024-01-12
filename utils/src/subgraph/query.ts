import { Client, OperationContext } from '@urql/core'
import { abiParamParseMap } from "../gmxUtils.js"
import { getMappedValue } from "../utils.js"
export { encodePacked } from 'viem'

export type GqlType<T extends string> = { __typename: T }

type PackedAbiType =
  | 'uint'
  | 'uint[]'
  | 'uint256'
  | 'uint256[]'
  | 'string'
  | 'string[]'
  | 'number'
  | 'number[]'
  | 'int'
  | 'int[]'
  | 'address'
  | 'address[]'
  | 'bool'
  | 'bool[]'
  | 'int256'
  | 'bytes'

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
  startBlock?: bigint

  first?: number
  skip?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export const documentQuery = <Type extends GqlType<any>, TQuery>(
  params: IQuerySubgraph<Type, TQuery>,
): string => {

  const typeName = params.schema.__typename as string
  const whereClause = parseWhereClause(params.filter)
  const fieldStructure = parseQueryObject(params.document ? params.document : fillQuery(params.schema))
  const graphDocumentIdentifier = `${typeName.charAt(0).toLowerCase() + typeName.slice(1)}s`
  const changeBlockFilterParam = params.startBlock ? ` _change_block: { number_gte: ${params.startBlock} }, ` : ''
  const orderByFilterParam = params.orderBy ? ` orderBy: ${params.orderBy}, ` : ''
  const orderDirectionFilterParam = params.orderDirection ? ` orderDirection: ${params.orderDirection}, ` : ''

  return `${graphDocumentIdentifier}(first: ${params.first || 1000}, ${orderByFilterParam} ${orderDirectionFilterParam} where: { ${changeBlockFilterParam} ${whereClause} }) { ${fieldStructure} }`
}

export const querySubgraph = <Type extends GqlType<any>, TQuery>(
  client: Client,
  params: IQuerySubgraph<Type, TQuery>,
  context?: Partial<OperationContext>,
): Promise<TQuery extends unknown ? Type[] : PrettifyReturn<ISchemaQuery<Type, TQuery>>[]> => {

  const typeName = params.schema.__typename as string
  const whereClause = parseWhereClause(params.filter)
  const fieldStructure = parseQueryObject(params.document ? params.document : fillQuery(params.schema))
  const graphDocumentIdentifier = `${typeName.charAt(0).toLowerCase() + typeName.slice(1)}s`
  const changeBlockFilterParam = params.startBlock ? ` _change_block: { number_gte: ${params.startBlock} }, ` : ''
  const orderByFilterParam = params.orderBy ? ` orderBy: ${params.orderBy}, ` : ''
  const orderDirectionFilterParam = params.orderDirection ? ` orderDirection: ${params.orderDirection}, ` : ''

  const entry = `${graphDocumentIdentifier}(first: ${params.first || 1000}, ${orderByFilterParam} ${orderDirectionFilterParam} where: { ${changeBlockFilterParam} ${whereClause} }) { ${fieldStructure} }`

  const newLogsFilter = client.query(`{ ${entry} }`, {}, context)
    .then(response => {
      if (response.error) throw new Error(`${graphDocumentIdentifier} query error: ${response.error.message}`)

      if (!(graphDocumentIdentifier in response.data)) {
        throw new Error(`No ${graphDocumentIdentifier} found in subgraph response`)
      }

      const list: PrettifyReturn<ISchemaQuery<Type, TQuery>>[] = response.data[graphDocumentIdentifier]

      if (list instanceof Array) {
        return list.map(item => parseQueryResults(item, params.schema))
      }

      throw new Error(`No ${graphDocumentIdentifier} found in subgraph response`)
    })

  return newLogsFilter as any
}


// recursively parse a json object to query result
export function parseQueryResults(json: any, schema: any) {
  const entity: any = {}
  Object.entries(json).forEach(([key, value]) => {
    const schemaType = schema[key]

    if (schemaType in abiParamParseMap) {
      const parseFn = getMappedValue(abiParamParseMap, schemaType)

      entity[key] = parseFn(value)
    } else if(value instanceof Array) {
      entity[key] = value.map((item, i) => parseQueryResults(item, schemaType))
    } else if(value instanceof Object) {
      entity[key] = parseQueryResults(value, schemaType )
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
  if (typeof query !== 'object') throw new Error('Query must be an object')

  const where: string[] = []

  Object.entries(query).forEach(([key, value]) => {

    if (value === undefined) return

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