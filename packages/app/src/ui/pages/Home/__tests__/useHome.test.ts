/**
 * @jest-environment jsdom
 */

import { IIdentityData } from "@cryptkeeperzk/types";
import { act, renderHook } from "@testing-library/react";
import { useRef } from "react";

import { defaultWalletHookData } from "@src/config/mock/wallet";
import { mockDefaultConnection } from "@src/config/mock/zk";
import { fetchConnections, useConnectedOrigins } from "@src/ui/ducks/connections";
import { useAppDispatch } from "@src/ui/ducks/hooks";
import { useIdentities, fetchIdentities, fetchHistory } from "@src/ui/ducks/identities";
import { checkHostApproval } from "@src/ui/ducks/permissions";
import { useEthWallet } from "@src/ui/hooks/wallet";
import { getLastActiveTabUrl } from "@src/util/browser";

import { useHome } from "../useHome";

jest.mock("react", (): unknown => ({
  ...jest.requireActual("react"),
  useRef: jest.fn(),
}));

jest.mock("@src/ui/hooks/wallet", (): unknown => ({
  useEthWallet: jest.fn(),
}));

jest.mock("@src/ui/ducks/hooks", (): unknown => ({
  useAppDispatch: jest.fn(),
}));

jest.mock("@src/ui/ducks/identities", (): unknown => ({
  fetchIdentities: jest.fn(),
  fetchHistory: jest.fn(),
  useIdentities: jest.fn(),
}));

jest.mock("@src/ui/ducks/connections", (): unknown => ({
  fetchConnections: jest.fn(),
  useConnectedOrigins: jest.fn(),
}));

jest.mock("@src/ui/ducks/permissions", (): unknown => ({
  checkHostApproval: jest.fn(),
}));

jest.mock("@src/util/browser", (): unknown => ({
  getLastActiveTabUrl: jest.fn(),
}));

describe("ui/pages/Home/useHome", () => {
  const mockDispatch = jest.fn();

  const defaultIdentities: IIdentityData[] = [
    {
      commitment: "1",
      metadata: {
        account: defaultWalletHookData.address!,
        name: "Account #1",
        groups: [],
        isDeterministic: true,
        isImported: false,
      },
    },
    {
      commitment: "2",
      metadata: {
        account: defaultWalletHookData.address!,
        name: "Account #2",
        groups: [],
        isDeterministic: true,
        isImported: false,
      },
    },
  ];

  const defaultConnectedOrigins = {
    1: mockDefaultConnection.urlOrigin,
  };

  const defaultUrl = new URL("http://localhost:3000");

  beforeEach(() => {
    (getLastActiveTabUrl as jest.Mock).mockResolvedValue(defaultUrl);

    (useRef as jest.Mock).mockReturnValue({ current: null });

    (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);

    (useEthWallet as jest.Mock).mockReturnValue(defaultWalletHookData);

    (useIdentities as jest.Mock).mockReturnValue(defaultIdentities);

    (useConnectedOrigins as jest.Mock).mockReturnValue(defaultConnectedOrigins);

    (checkHostApproval as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return initial data", () => {
    const { result } = renderHook(() => useHome());

    expect(result.current.address).toBe(defaultWalletHookData.address);
    expect(result.current.identities).toStrictEqual(defaultIdentities);
    expect(fetchIdentities).toBeCalledTimes(1);
    expect(fetchConnections).toBeCalledTimes(1);
    expect(fetchHistory).toBeCalledTimes(1);
    expect(mockDispatch).toBeCalledTimes(3);
  });

  test("should refresh connection status properly", async () => {
    const { result } = renderHook(() => useHome());

    await act(async () => result.current.refreshConnectionStatus());

    expect(checkHostApproval).toBeCalledTimes(1);
    expect(checkHostApproval).toBeCalledWith(defaultUrl.origin);
  });

  test("should not refresh connection status if there is no any tab", async () => {
    (getLastActiveTabUrl as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useHome());

    await act(async () => result.current.refreshConnectionStatus());

    expect(checkHostApproval).not.toBeCalled();
  });
});
