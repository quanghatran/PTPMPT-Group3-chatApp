import React, { Suspense } from 'react';
import { Route, Switch } from "react-router-dom";
import Auth from "../hoc/auth";
// pages for this product
import RegisterPage from "./views/RegisterPage/RegisterPage.js";

function App() {
  return (
    <Suspense fallback={(<div>Loading...</div>)}>
      <NavBar />
      <div className="content_wrapper" style={{ paddingTop: '75px', minHeight: 'calc(100vh - 80px)' }}>
        <Switch>
          <Route exact path="/register" component={Auth(RegisterPage, false)} />
        </Switch>
      </div>
      <Footer />
    </Suspense>
  );
}

export default App;