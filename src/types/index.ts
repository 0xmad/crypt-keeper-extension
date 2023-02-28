import { MerkleProof } from "@zk-kit/incremental-merkle-tree";

export type Request = {
  method: string;
  payload?: any;
  error?: boolean;
  meta?: any;
};

export type IdentityStrategy = "interrep" | "random";
export type IdentityWeb2Provider = "twitter" | "github" | "reddit";

export type CreateIdentityOptions = {
  nonce?: number;
  web2Provider?: IdentityWeb2Provider;
  account?: string;
  name?: string;
};

export type NewIdentityRequest = {
  strategy: IdentityStrategy;
  messageSignature: string;
  options: CreateIdentityOptions;
};

export type MerkleProofArtifacts = {
  leaves: string[];
  depth: number;
  leavesPerNode: number;
};

export type ZkInputs = {
  merkleStorageAddress?: string;
  merkleProofArtifacts?: MerkleProofArtifacts;
  merkleProof?: MerkleProof;
};

export enum PendingRequestType {
  SEMAPHORE_PROOF,
  RLN_PROOF,
  DUMMY,
  APPROVE,
  INJECT,
  CREATE_IDENTITY,
}

export type PendingRequest = {
  id: string;
  type: PendingRequestType;
  payload?: any;
};

export type RequestResolutionAction<data> = {
  id: string;
  status: "accept" | "reject";
  data?: data;
};

export type IdentityMetadata = {
  account: string;
  name: string;
  web2Provider: IdentityStrategy;
};

export type IdentityName = {
  identityCommitment: string;
  name: string;
};

export type SerializedIdentity = {
  metadata: IdentityMetadata;
  secret: string;
};

export enum ZkProofType {
  SEMAPHORE,
  RLN,
}

export type MessageAction = {
  method: string;
  payload?: any;
  error?: boolean;
  meta?: any;
};

export type ReduxAction = {
  type: string;
  payload?: any;
  error?: boolean;
  meta?: any;
};

export interface DeferredPromise<T> {
  promise: Promise<T>;
  resolve?: (arg: T | PromiseLike<T>) => void;
  reject?: (reason?: unknown) => void;
}
