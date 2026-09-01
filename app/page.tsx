import prisma from "@/lib/db";
const page = async () => {
  const users = await prisma.user.findMany();
  return (
    <div>
      <h1>Welcome to GemEzy</h1>
      {JSON.stringify(users)}
    </div>
  );
};

export default page;