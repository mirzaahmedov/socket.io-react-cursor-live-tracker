import React from "react"
import styled, { createGlobalStyle } from "styled-components"
import { io } from "socket.io-client"

import Pointer from "./Pointer"

const GlobalStyles = createGlobalStyle`
  *::before, *, *::after {
    box-sizing: border-box;
  }
  * {
    margin: 0;
    padding: 0;
  }
  body {
    font-size: 16px;
    font-family: "Inter", sans-serif;
  }
`
const Form = styled.form`
  margin: 100px auto;
  width: 400px;
`
const Textfield = styled.input`
  display: block;
  width: 100%;
`
const Button = styled.button`
  margin-top: 20px;
`
const Frame = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`
const Cursor = styled.div`
  position: absolute;
  width: 40px;
  transition: left 0.2s, top 0.2s;
`
const Toolkit = styled.span`
  position: absolute;
  left: 80%;
  bottom: 0;
  padding: 4px 10px;
  font-size: 14px;
  font-family: "Inter", sans-serif;
  border-radius: 20px;
  background: #5a5a5a;
  color: white;
  white-space: nowrap;
`

function throtle(func, delay = 100) {
  let shouldWait = false
  let memo = null

  function timeoutFunc() {
    if (memo === null) {
      shouldWait = false
    } else {
      func(...memo)
      memo = null
      setTimeout(timeoutFunc, delay)
    }
  }

  return function (...args) {
    if (shouldWait) {
      memo = args
      return
    }

    func(...args)
    shouldWait = true

    setTimeout(timeoutFunc, delay)
  }
}

export default function App() {
  const socket = React.useRef()

  const [value, setValue] = React.useState("")
  const [username, setUsername] = React.useState(null)
  const [cursors, setCursors] = React.useState([])

  React.useEffect(
    function () {
      if (!username) return

      socket.current = io("http://localhost:4000", {
        query: {
          username,
        },
      })

      const sendMousePostion = throtle(function (x, y) {
        socket.current.emit("mousemove", { x, y })
      })

      document.onmousemove = function (event) {
        const { clientX, clientY } = event
        sendMousePostion(clientX, clientY)
      }

      socket.current.on("mousemove", function (data) {
        setCursors(function (state) {
          const copy = [...state]
          const match = copy.find((cursor) => cursor.username === data.username)
          if (match) {
            match.position = data.position
            return copy
          } else {
            copy.push(data)
            return copy
          }
        })
      })
      socket.current.on("userleave", function (user) {
        setCursors(function (state) {
          const copy = [...state]
          const matchIndex = copy.findIndex(
            (cursor) => cursor.username === user
          )
          copy.splice(matchIndex, 1)
          return copy
        })
      })
    },
    [username]
  )

  return (
    <Frame>
      <GlobalStyles />
      {username ? (
        cursors.map(function (cursor, index) {
          return (
            <Cursor
              key={index}
              style={{
                left: cursor?.position?.x,
                top: cursor?.position?.y,
              }}
            >
              <Pointer />
              <Toolkit>{cursor.username}</Toolkit>
            </Cursor>
          )
        })
      ) : (
        <Form
          onSubmit={function (event) {
            event.preventDefault()
            setUsername(value)
          }}
        >
          <h1>Choose username</h1>
          <Textfield
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <Button type="submit">Continue</Button>
        </Form>
      )}
    </Frame>
  )
}
