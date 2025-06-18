import { PrismaClient } from "@/generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

const prismaSingleton = () => {
	return new PrismaClient().$extends(withAccelerate());
};

type PrismaSingleton = ReturnType<typeof prismaSingleton>;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;