/*
#[test_only]
module move::move_tests;
// uncomment this line to import the module
// use move::move;

const ENotImplemented: u64 = 0;

#[test]
fun test_move() {
    // pass
}

#[test, expected_failure(abort_code = ::move::move_tests::ENotImplemented)]
fun test_move_fail() {
    abort ENotImplemented
}
*/
#[test_only]
module mooncl::mooncl_test;

const ENotImplemented: u64 = 0;

#[test]
public fun test_pool() {
    // pass
}

#[test, expected_failure(abort_code = ENotImplemented)]
public fun test_distribute() {
    abort ENotImplemented
}