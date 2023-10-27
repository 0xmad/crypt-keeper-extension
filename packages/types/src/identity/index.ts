export interface ICreateIdentityOptions {
  message: string;
  account: string;
  nonce: number;
  name?: string;
}

export interface ICreateIdentityRequestArgs {
  urlOrigin: string;
}

export interface IConnectIdentityRequestArgs {
  urlOrigin: string;
}

export interface IImportIdentityRequestArgs {
  trapdoor: string;
  nullifier: string;
}

export interface INewIdentityRequest {
  options: ICreateIdentityOptions;
  walletType: EWallet;
  groups: IGroupData[];
  isDeterministic: boolean;
  urlOrigin?: string;
  messageSignature?: string;
}

export interface IImportIdentityArgs {
  name: string;
  trapdoor: string;
  nullifier: string;
  messageSignature: string;
  urlOrigin?: string;
}

export enum EWallet {
  CRYPTKEEPER_WALLET,
  ETH_WALLET,
}

export interface IIdentityMetadata {
  name: string;
  groups: IGroupData[];
  isDeterministic: boolean;
  isImported: boolean;
  account?: string;
  nonce?: number;
  urlOrigin?: string;
}

export type ConnectedIdentityMetadata = Pick<IIdentityMetadata, "name" | "urlOrigin">;

export interface IGroupData {
  id: string;
  name: string;
  favicon?: string;
  description?: string;
  api?: string;
  contract?: string;
}

export interface IIdentityData {
  commitment: string;
  metadata: IIdentityMetadata;
}

export interface ISetIdentityNameArgs {
  identityCommitment: string;
  name: string;
}

export interface ISetIdentityHostArgs {
  identityCommitment: string;
  urlOrigin: string;
}

export interface IConnectIdentityArgs {
  identityCommitment: string;
  urlOrigin: string;
}

export interface ISerializedIdentity {
  metadata: IIdentityMetadata;
  secret: string;
}

export interface ICreateIdentityArgs {
  name: string;
  groups: IGroupData[];
  isDeterministic: boolean;
  isImported: boolean;
  account?: string;
  messageSignature?: string;
  nonce?: number;
  urlOrigin?: string;
  trapdoor?: string;
  nullifier?: string;
}

export interface IIdenityConnection extends ConnectedIdentityMetadata {
  commitment: string;
}

export interface IConnectArgs {
  commitment: string;
}
