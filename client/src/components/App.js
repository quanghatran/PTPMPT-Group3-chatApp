import React, { Suspense, useEffect } from 'react';
import { Route, Switch } from "react-router-dom";
import Auth from "../hoc/auth";
// pages for this product
import LandingPage from "./views/LandingPage/LandingPage.js";
import LoginPage from "./views/LoginPage/LoginPage.js";
import RegisterPage from "./views/RegisterPage/RegisterPage.js";
import ChatPage from "./views/ChatPage/ChatPage"
import NavBar from "./views/NavBar/NavBar";
import Footer from "./views/Footer/Footer"
import {connectWithWebSocket} from '../utils/wssConnection/wssConnection'
import Dashboard from './views/Dashboard/Dashboard';
import LoginPageCall from './views/LoginPageCall/LoginPageCall';

function App() {

  useEffect(() => {
    connectWithWebSocket()
  }, [])

  return (
    <Suspense fallback={(<div>Loading...</div>)}>
      <NavBar />
      <div className="content_wrapper" style={{ paddingTop: '75px', minHeight: 'calc(100vh - 80px)' }}>
        <Switch>
          <Route exact path="/" component={Auth(LandingPage, null)} />
          <Route exact path="/chat" component={Auth(ChatPage, null)} />
          <Route exact path="/login" component={Auth(LoginPage, false)} />
          <Route exact path="/register" component={Auth(RegisterPage, false)} />
          <Route exact path="/dashboard" component={Dashboard} />
          <Route exact path="/loginPage" component={LoginPageCall} />
        </Switch>
      </div>
      <Footer />
    </Suspense>
  );
}

export default App;
