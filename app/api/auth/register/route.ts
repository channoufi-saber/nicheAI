import prisma from "@/lib/prisma";
import { PlanType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;
    if (!email || !password) {
      return NextRequest.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextRequest.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: Role.USER,
        image: "/default-avatar.png",
        subscription: {
          create: {
            planType: PlanType.FREE,
            isActive: true,
          },
        },
        usage: {
          create: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            validationCount: 0,
          },
        },
      },
      include: { subscription: true },
    });
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(
      {
        message: "User created successfully",
        user: userWithoutPassword,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
  }
}
