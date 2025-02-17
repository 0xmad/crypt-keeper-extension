import SimpleStorage from "@src/background/services/storage";

import ApprovalService from "..";

const mockDefaultHosts = ["https://localhost:3000"];
const mockSerializedApprovals = JSON.stringify([[mockDefaultHosts[0], { canSkipApprove: true }]]);

jest.mock("@src/background/services/crypto", (): unknown => ({
  ...jest.requireActual("@src/background/services/crypto"),
  getInstance: jest.fn(() => ({
    encrypt: jest.fn(() => mockSerializedApprovals),
    decrypt: jest.fn(() => mockSerializedApprovals),
    generateEncryptedHmac: jest.fn(() => "encrypted"),
    getAuthenticBackup: jest.fn((encrypted: string | Record<string, string>) => encrypted),
  })),
}));

jest.mock("@src/background/services/storage");

interface MockStorage {
  get: jest.Mock;
  set: jest.Mock;
  clear: jest.Mock;
}

describe("background/services/approval", () => {
  const approvalService = ApprovalService.getInstance();

  beforeEach(() => {
    process.env.NODE_ENV = "test";

    (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
      instance.get.mockReturnValue(mockSerializedApprovals);
      instance.set.mockReturnValue(undefined);
      instance.clear.mockReturnValue(undefined);
    });
  });

  afterEach(async () => {
    process.env.NODE_ENV = "test";
    await approvalService.lock();
    await approvalService.clear();

    (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
      instance.get.mockClear();
      instance.set.mockClear();
      instance.clear.mockClear();
    });
  });

  describe("clear", () => {
    test("should clear approved service properly", async () => {
      await approvalService.unlock();
      await approvalService.clear();
      const hosts = approvalService.getAllowedHosts();

      expect(hosts).toHaveLength(0);
    });

    test("should not clear for production env", async () => {
      process.env.NODE_ENV = "production";

      await approvalService.clear();

      (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
        expect(instance.clear).not.toBeCalled();
      });
    });
  });

  describe("unlock", () => {
    test("should unlock properly without stored data", async () => {
      (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
        instance.get.mockReturnValue(undefined);
      });

      const result = await approvalService.unlock();
      const hosts = approvalService.getAllowedHosts();
      const isApproved = approvalService.isApproved(mockDefaultHosts[0]);

      expect(result).toBe(true);
      expect(hosts).toHaveLength(0);
      expect(isApproved).toBe(false);
    });

    test("should unlock properly", async () => {
      const result = await approvalService.unlock();
      const hosts = approvalService.getAllowedHosts();
      const isApproved = approvalService.isApproved(mockDefaultHosts[0]);

      expect(result).toBe(true);
      expect(isApproved).toBe(true);
      expect(hosts).toHaveLength(1);
      expect(hosts).toStrictEqual(mockDefaultHosts);
    });

    test("should await unlock properly", async () => {
      approvalService.awaitUnlock();
      const isUnlocked = await approvalService.unlock();
      const isUnlockCompleted = approvalService.onUnlocked();

      expect(isUnlocked).toBe(true);
      expect(isUnlockCompleted).toBe(true);
    });

    test("should not unlock twice", async () => {
      const isUnlockedFirst = await approvalService.unlock();
      const isUnlockedSecond = await approvalService.unlock();

      expect(isUnlockedFirst).toBe(true);
      expect(isUnlockedSecond).toBe(true);
      expect(await approvalService.awaitUnlock()).toBeUndefined();
    });
  });

  describe("permissions", () => {
    test("should get permissions properly", async () => {
      await approvalService.unlock();
      const result = approvalService.getPermission(mockDefaultHosts[0]);

      expect(result).toStrictEqual({ urlOrigin: mockDefaultHosts[0], canSkipApprove: true });
    });

    test("should get permissions for unknown urlOrigin", () => {
      const result = approvalService.getPermission("unknown");

      expect(result).toStrictEqual({ urlOrigin: "unknown", canSkipApprove: false });
    });

    test("should set permission", async () => {
      const result = await approvalService.setPermission({ urlOrigin: mockDefaultHosts[0], canSkipApprove: true });
      const canSkipApprove = approvalService.canSkipApprove(mockDefaultHosts[0]);

      expect(result).toStrictEqual({ urlOrigin: mockDefaultHosts[0], canSkipApprove: true });
      expect(canSkipApprove).toBe(true);

      (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
        expect(instance.set).toBeCalledTimes(1);
        expect(instance.set).toBeCalledWith(mockSerializedApprovals);
      });
    });

    test("should set permission for unknown urlOrigin", async () => {
      const result = await approvalService.setPermission({ urlOrigin: "unknown", canSkipApprove: false });

      expect(result).toStrictEqual({ urlOrigin: "unknown", canSkipApprove: false });

      (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
        expect(instance.set).toBeCalledTimes(1);
      });
    });
  });

  describe("approvals", () => {
    test("should add new approval properly", async () => {
      await approvalService.add({ urlOrigin: mockDefaultHosts[0], canSkipApprove: true });
      const hosts = approvalService.getAllowedHosts();

      expect(hosts).toStrictEqual(mockDefaultHosts);

      (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
        expect(instance.set).toBeCalledTimes(1);
        expect(instance.set).toBeCalledWith(mockSerializedApprovals);
      });
    });

    test("should not approve duplicated url origin after unlock", async () => {
      await approvalService.unlock();
      await approvalService.add({ urlOrigin: mockDefaultHosts[0], canSkipApprove: true });
      const hosts = approvalService.getAllowedHosts();

      expect(hosts).toStrictEqual(mockDefaultHosts);

      (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
        expect(instance.set).not.toBeCalled();
      });
    });

    test("should remove approved url origin properly", async () => {
      await approvalService.unlock();
      await approvalService.remove({ urlOrigin: mockDefaultHosts[0] });
      const hosts = approvalService.getAllowedHosts();

      expect(hosts).toHaveLength(0);

      (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
        expect(instance.set).toBeCalledTimes(1);
      });
    });

    test("should not remove if there's no such approved urlOrigin", async () => {
      await approvalService.unlock();
      await approvalService.remove({ urlOrigin: "unknown" });
      const hosts = approvalService.getAllowedHosts();

      expect(hosts).toStrictEqual(mockDefaultHosts);

      (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
        expect(instance.set).not.toBeCalled();
      });
    });

    test("should check if origin is approved properly", async () => {
      await approvalService.unlock();

      const result = approvalService.isOriginApproved({}, { urlOrigin: mockDefaultHosts[0] });

      expect(result).toStrictEqual({});
    });

    test("should throw error if origin is not approved", async () => {
      await approvalService.unlock();

      expect(() => approvalService.isOriginApproved({}, { urlOrigin: "unknown" })).toThrowError(
        "CryptKeeper: origin is not approved",
      );
    });

    test("should throw error if origin is not provided", async () => {
      await approvalService.unlock();

      expect(() => approvalService.isOriginApproved({}, { urlOrigin: "" })).toThrowError(
        "CryptKeeper: origin is not set",
      );
    });
  });

  describe("backup", () => {
    test("should download encrypted approvals", async () => {
      const result = await approvalService.downloadEncryptedStorage("password");

      expect(result).toBeDefined();
    });

    test("should not download encrypted approvals if storage is empty", async () => {
      (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
        instance.get.mockReturnValue(undefined);
      });

      const result = await approvalService.downloadEncryptedStorage("password");

      expect(result).toBeNull();
    });

    test("should upload encrypted approvals", async () => {
      await approvalService.uploadEncryptedStorage("encrypted", "password");

      (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
        expect(instance.set).toBeCalledTimes(1);
      });
    });

    test("should not upload encrypted approvals if there is no data", async () => {
      await approvalService.uploadEncryptedStorage("", "");

      (SimpleStorage as jest.Mock).mock.instances.forEach((instance: MockStorage) => {
        expect(instance.set).toBeCalledTimes(0);
      });
    });

    test("should throw error when trying upload incorrect backup", async () => {
      await expect(approvalService.uploadEncryptedStorage({}, "password")).rejects.toThrow(
        "Incorrect backup format for approvals",
      );
    });

    test("should download storage properly", async () => {
      const [storage] = (SimpleStorage as jest.Mock).mock.instances as [MockStorage];

      await approvalService.downloadStorage();

      expect(storage.get).toBeCalledTimes(1);
    });

    test("should restore storage properly", async () => {
      const [storage] = (SimpleStorage as jest.Mock).mock.instances as [MockStorage];

      await approvalService.restoreStorage("storage");

      expect(storage.set).toBeCalledTimes(1);
      expect(storage.set).toBeCalledWith("storage");
    });

    test("should throw error when trying to restore incorrect data", async () => {
      await expect(approvalService.restoreStorage({})).rejects.toThrow("Incorrect restore format for approvals");
    });
  });
});
