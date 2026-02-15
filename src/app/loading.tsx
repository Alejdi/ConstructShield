import Image from "next/image";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="border-spinner relative flex items-center justify-center rounded-full p-4">
        <Image
          src="/images/logo.png"
          alt="ConstructShield"
          width={64}
          height={64}
          className="logo-loader"
          priority
        />
      </div>
    </div>
  );
}
