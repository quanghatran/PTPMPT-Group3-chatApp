import React, { useEffect } from 'react';
import { auth } from '../store/_actions/user_actions';
import { useSelector, useDispatch } from "react-redux";

export default function (ComposedClass, reload, adminRoute = null) {
    function AuthenticationCheck(props) {

        let user = useSelector(state => state.user);
        const dispatch = useDispatch();

        useEffect(() => {
            
            // let w_auth =  document.cookie.split(";")[1].replace(" w_auth=", "");
            if(user.loginSucces) {
                
                document.cookie = `w_auth=${user.loginSucces.w_auth}`;
                dispatch(auth(user.loginSucces.w_auth)).then(async response => {
                    console.log(response)
                    localStorage.setItem("name", response.payload.name)
                    // document.cookie = `id=${response.payload._id}`;
                    if (await !response.payload.isAuth) {
                        if (reload) {
                            // console.log("user: ", user)
                            props.history.push('/register_login')
                        }
                        // console.log("user ", user);
                    } else {
                        // console.log("document.cookie ", document.cookie);

                        if (adminRoute && !response.payload.isAdmin) {
                            props.history.push('/')
                        }
                        else {
                            if (reload === false) {
                                props.history.push('/')
                            }
                        }
                    }
                })
            } else {
                if(document.cookie) {
                // console.log(document.cookie.replace("w_auth=", ""))
                dispatch(auth(document.cookie.replace("w_auth=", ""))).then(async response => {
                        if (await !response.payload.isAuth) {
                            if (reload) {
                                props.history.push('/register_login')
                            }
                            // console.log("user ", user);
                        } else {
                            // console.log("document.cookie ", document.cookie);

                            if (adminRoute && !response.payload.isAdmin) {
                                props.history.push('/')
                            }
                            else {
                                if (reload === false) {
                                    props.history.push('/')
                                }
                            }
                        }
                    })
                } else {
                    dispatch(auth()).then(async response => {
                        if (await !response.payload.isAuth) {
                            if (reload) {
                                props.history.push('/register_login')
                            }
                            // console.log("user ", user);
                        } else {
                            // console.log("document.cookie ", document.cookie);

                            if (adminRoute && !response.payload.isAdmin) {
                                props.history.push('/')
                            }
                            else {
                                if (reload === false) {
                                    props.history.push('/')
                                }
                            }
                        }
                    })
                }

            }
            
        }, [dispatch, props.history, user.googleAuth])

        return (
            <ComposedClass {...props} user={user} />
        )
    }
    return AuthenticationCheck
}


