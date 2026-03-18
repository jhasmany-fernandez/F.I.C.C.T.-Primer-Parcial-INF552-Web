import Link from "next/link";
import SignupWithPassword from "../SignupWithPassword";

export default function Signup() {
  return (
    <>
      <div>
        <SignupWithPassword />
      </div>

      <div className="mt-6 text-center">
        <p>
          ¿Ya tienes una cuenta?{" "}
          <Link href="/auth/sign-in" className="text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </>
  );
}
