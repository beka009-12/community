import PathPanel from "@/src/components/login-sections/PathPanel";
import LoginForm from "@/src/components/login-sections/LoginForm";
import scss from "./Login.module.scss";

const Login = () => (
  <div className={scss.page}>
    <PathPanel />
    <LoginForm />
  </div>
);

export default Login;
