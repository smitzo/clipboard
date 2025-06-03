const Navbar = () => {
  return (
    <>
      <div className="navbar w-full flex justify-center py-[7px]">
        <div className="box flex justify-between font-bold text-white rounded-xl bg-[rgb(29,53,87)] py-[30px] w-[95%] ">
          <div className="logo w-[20%] text-3xl">Clipboard</div>
          <div className="links flex w-[35%] gap-[10%] justify-center text-xl">
            <a href="#">Home</a>
            <a href="#">About</a>
            <a href="#">Update</a>
            <a href="#">Feedback</a>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar
