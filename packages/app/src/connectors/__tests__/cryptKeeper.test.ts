/**
 * @jest-environment jsdom
 */

import { initializeCryptKeeperProvider, EventName } from "@cryptkeeperzk/providers";
import { waitFor } from "@testing-library/react";
import EventEmitter2 from "eventemitter2";

import { ZERO_ADDRESS } from "@src/config/const";
import postMessage from "@src/util/postMessage";

import { cryptKeeper, cryptKeeperHooks, CryptkeeperConnector } from "..";

describe("connectors/cryptKeeper", () => {
  const cancelActivation = jest.fn();

  const mockAddresses = [ZERO_ADDRESS];

  const mockActions = {
    startActivation: jest.fn(() => cancelActivation),
    update: jest.fn(),
    resetState: jest.fn(),
  };

  interface MockProvider {
    isCryptKeeper: boolean;
    accounts: () => Promise<string[]>;
    connect: () => Promise<void>;
  }

  const mockProvider = new EventEmitter2() as MockProvider & EventEmitter2;

  beforeEach(() => {
    mockProvider.isCryptKeeper = true;
    mockProvider.accounts = jest.fn(() => Promise.resolve(mockAddresses));
    mockProvider.connect = jest.fn(() => Promise.resolve());

    (initializeCryptKeeperProvider as jest.Mock).mockReturnValue(mockProvider);
  });

  afterEach(() => {
    mockProvider.removeAllListeners();
    jest.clearAllMocks();
  });

  test("should return connector objects and hooks", () => {
    expect(cryptKeeper).toBeDefined();
    expect(cryptKeeperHooks).toBeDefined();
  });

  test("should activate connector properly", async () => {
    (postMessage as jest.Mock).mockResolvedValue(mockAddresses);

    const connector = new CryptkeeperConnector(mockActions);

    await connector.activate();

    expect(mockActions.update).toBeCalledTimes(1);
    expect(mockActions.update).toBeCalledWith({ accounts: mockAddresses });
  });

  test("should activate connector twice properly", async () => {
    const connector = new CryptkeeperConnector(mockActions);

    await connector.activate();
    await connector.activate();

    expect(mockActions.update).toBeCalledTimes(2);
  });

  test("should start activation properly", async () => {
    mockProvider.isCryptKeeper = false;
    mockProvider.accounts = jest.fn(() => Promise.resolve(mockAddresses));
    mockProvider.connect = jest.fn(() => Promise.resolve());
    (initializeCryptKeeperProvider as jest.Mock).mockReturnValue(mockProvider);

    const connector = new CryptkeeperConnector(mockActions);

    await connector.activate();

    expect(mockActions.startActivation).toBeCalledTimes(1);
  });

  test("should throw error if there is no provider", async () => {
    (initializeCryptKeeperProvider as jest.Mock).mockReturnValue(undefined);

    const connector = new CryptkeeperConnector(mockActions);

    await expect(connector.activate()).rejects.toThrow("No CryptKeeper extension installed");
    expect(mockActions.startActivation).toBeCalledTimes(1);
    expect(cancelActivation).toBeCalledTimes(1);
  });

  test("should handle incomming events properly", async () => {
    (postMessage as jest.Mock).mockResolvedValue(mockAddresses);

    const connector = new CryptkeeperConnector(mockActions);

    await connector.activate();
    await waitFor(() => expect(mockActions.update).toBeCalledTimes(1));
    await waitFor(() => expect(mockActions.update).toBeCalledWith({ accounts: mockAddresses }));

    await Promise.resolve(mockProvider.emit(EventName.LOGOUT));

    expect(mockActions.resetState).toBeCalledTimes(1);
  });

  test("should not connect eagerly if there is no provider", async () => {
    (initializeCryptKeeperProvider as jest.Mock).mockReturnValue(undefined);
    const connector = new CryptkeeperConnector(mockActions);

    await connector.connectEagerly();

    expect(mockActions.startActivation).toBeCalledTimes(1);
    expect(cancelActivation).toBeCalledTimes(1);
  });

  test("should reset state when connecting eagerly throws an error", async () => {
    (initializeCryptKeeperProvider as jest.Mock).mockImplementation(() => {
      throw new Error();
    });
    const connector = new CryptkeeperConnector(mockActions);

    await connector.connectEagerly();

    expect(mockActions.startActivation).toBeCalledTimes(1);
    expect(mockActions.resetState).toBeCalledTimes(1);
    expect(cancelActivation).toBeCalledTimes(1);
  });

  test("should connect eagerly and set accounts properly", async () => {
    (postMessage as jest.Mock).mockResolvedValue(mockAddresses);

    const connector = new CryptkeeperConnector(mockActions);

    await connector.connectEagerly();

    expect(mockActions.startActivation).toBeCalledTimes(1);
    expect(mockActions.update).toBeCalledTimes(1);
    expect(mockActions.update).toBeCalledWith({ accounts: mockAddresses });
  });
});
