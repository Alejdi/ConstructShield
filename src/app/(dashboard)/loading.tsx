import Image from "next/image";

export default function DashboardLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="border-spinner relative flex items-center justify-center rounded-full p-3">
        <Image
          src="/images/logo.png"
          alt="ConstructShield"
          width={48}
          height={48}
          className="logo-loader"
          priority
        />
      </div>
    </div>
  );
}
